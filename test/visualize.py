import torch
import os
import numpy as np
import matplotlib.pyplot as plt
from architecture import model_generator
from utils import LoadTest, init_mask, init_meas
from option import opt
from collections import OrderedDict
import matplotlib.gridspec as gridspec
import scipy.io as scio

output_root = "test_image"
os.makedirs(output_root, exist_ok=True)
mat_output_root = os.path.join(output_root, "mat")
os.makedirs(mat_output_root, exist_ok=True)
mat_cassi_ssl_output_root = os.path.join(output_root, "mat_cassi_ssl")
os.makedirs(mat_cassi_ssl_output_root, exist_ok=True)

our_model_path = "/root/gpufree-data/CASSI-SSL/exp/Muon_early_stop/2025_09_06_01_06_28/model/model_epoch_87.pth"
cassi_ssl_model_path = (
    "/root/gpufree-data/CASSI-SSL/exp/Adam_1e-3/model/model_epoch_265.pth"
)
test_data_path = "/root/gpufree-data/CASSI-SSL/dataset/test/Truth/"
gpu_id = "0"


device = torch.device(f"cuda:{gpu_id}" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")


def load_model_from_path(model_path, device):
    """Loads a model and handles state_dict key inconsistencies."""
    model = model_generator(opt.method, opt.pretrained_model_path).to(device)
    checkpoint = torch.load(model_path, map_location=device)

    new_state_dict = OrderedDict()
    # print(checkpoint.keys())
    state_dict_to_iterate = checkpoint.get("state_dict", checkpoint)

    for k, v in state_dict_to_iterate.items():
        # print(k)
        if k.startswith("module."):
            name = k[7:]  # delete `module.` prefix
        else:
            name = k
        new_state_dict[name] = v

    model.load_state_dict(new_state_dict)
    model.eval()
    print(f"Model loaded from {model_path}")
    return model


def hsi_to_rgb(hsi_data, bands=(23, 14, 3)):
    # C, H, W
    r, g, b = bands
    rgb = np.stack([hsi_data[r, :, :], hsi_data[g, :, :], hsi_data[b, :, :]], axis=-1)
    # Normalize to 0-1 range for image display
    rgb = (rgb - np.min(rgb)) / (np.max(rgb) - np.min(rgb) + 1e-8)
    return rgb

def wavelength_to_rgb(wavelength):
    """
    Converts a wavelength in nm to an RGB color tuple.
    Visible spectrum is approximately 380nm to 750nm.
    """
    if 380 <= wavelength < 440:
        R = -(wavelength - 440) / (440 - 380)
        G = 0.0
        B = 1.0
    elif 440 <= wavelength < 490:
        R = 0.0
        G = (wavelength - 440) / (490 - 440)
        B = 1.0
    elif 490 <= wavelength < 510:
        R = 0.0
        G = 1.0
        B = -(wavelength - 510) / (510 - 490)
    elif 510 <= wavelength < 580:
        R = (wavelength - 510) / (580 - 510)
        G = 1.0
        B = 0.0
    elif 580 <= wavelength < 645:
        R = 1.0
        G = -(wavelength - 645) / (645 - 580)
        B = 0.0
    elif 645 <= wavelength <= 750:
        R = 1.0
        G = 0.0
        B = 0.0
    else:
        R, G, B = 0.0, 0.0, 0.0
    
    # Intensity correction
    factor = 1.0
    if 380 <= wavelength < 420:
        factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380)
    elif 420 <= wavelength < 645:
        factor = 1.0
    elif 645 <= wavelength <= 750:
        factor = 0.3 + 0.7 * (750 - wavelength) / (750 - 645)
        
    R = (R * factor)
    G = (G * factor)
    B = (B * factor)

    return (R, G, B)

# --- Load Models ---
our_model = load_model_from_path(our_model_path, device)
cassi_ssl_model = load_model_from_path(cassi_ssl_model_path, device)

test_data_loader = LoadTest(test_data_path)
test_file_names = [
    os.path.splitext(f)[0] for f in os.listdir(test_data_path) if f.endswith(".mat")
]
mask3d_batch_test, input_mask_test = init_mask(
    "/root/gpufree-data/CASSI-SSL/dataset", "Phi_PhiPhiT", 1
)
input_mask_test = [m.to(device) for m in input_mask_test]


def save_tensor_as_png(tensor, filename):
    """
    Normalizes a 2D tensor to [0, 1] and saves it as a grayscale PNG image.
    """
    # Detach from graph, move to CPU, and convert to numpy
    img_np = tensor.detach().cpu().numpy()
    # Normalize to 0-1 range for image saving
    img_np = (img_np - img_np.min()) / (img_np.max() - img_np.min() + 1e-8)
    plt.imsave(filename, img_np, cmap="gray")


# --- Main Visualization Loop ---
with torch.no_grad():
    for i, file_name in enumerate(test_file_names):
        print(f"Processing {file_name}...")

        # Load a single ground truth image, add batch dimension, and move to device
        gt_hsi = (
            test_data_loader[i].unsqueeze(0).to(device).float()
        )  # Shape: [1, C, H, W]

        # 1. Generate the compressed measurement image
        input_meas = init_meas(gt_hsi, mask3d_batch_test.to(device), opt.input_setting)

        # 2. Get model reconstructions
        our_reconstructed_hsi = our_model(input_meas, input_mask_test)
        cassi_ssl_reconstructed_hsi = cassi_ssl_model(input_meas, input_mask_test)

        # Save our reconstructed HSI as a .mat file
        recon_to_save_ours = np.transpose(our_reconstructed_hsi.squeeze(0).cpu().numpy(), (1, 2, 0))
        mat_path_ours = os.path.join(mat_output_root, f"{file_name}.mat")
        scio.savemat(mat_path_ours, {'recon': recon_to_save_ours})
        print(f"  Saved our .mat file to {mat_path_ours}")

        # Save CASSI-SSL reconstructed HSI as a .mat file
        recon_to_save_cassi = np.transpose(cassi_ssl_reconstructed_hsi.squeeze(0).cpu().numpy(), (1, 2, 0))
        mat_path_cassi = os.path.join(mat_cassi_ssl_output_root, f"{file_name}.mat")
        scio.savemat(mat_path_cassi, {'recon': recon_to_save_cassi})
        print(f"  Saved CASSI-SSL .mat file to {mat_path_cassi}")

        # --- Create Composite Visualization ---
        fig = plt.figure(figsize=(24, 16))
        gs = gridspec.GridSpec(4, 4, width_ratios=[3.0, 1, 1, 1])
        
        # Move tensors to CPU for plotting
        input_meas_cpu = input_meas.squeeze(0).cpu().numpy()
        gt_hsi_cpu = gt_hsi.squeeze(0).cpu().numpy()
        our_reconstructed_hsi_cpu = our_reconstructed_hsi.squeeze(0).cpu().numpy()
        cassi_ssl_reconstructed_hsi_cpu = cassi_ssl_reconstructed_hsi.squeeze(0).cpu().numpy()

        # Generate RGB images
        gt_rgb = hsi_to_rgb(gt_hsi_cpu)
        our_recon_rgb = hsi_to_rgb(our_reconstructed_hsi_cpu)

        # Save the reconstructed RGB image separately
        recon_rgb_path = os.path.join(output_root, f"{file_name}_recon_rgb.png")
        plt.imsave(recon_rgb_path, our_recon_rgb)
        print(f"  Saved reconstructed RGB image to {recon_rgb_path}")

        # a) Create a nested GridSpec for RGB and Measurement plots in the top-left
        gs_top_left = gridspec.GridSpecFromSubplotSpec(1, 2, subplot_spec=gs[0:2, 0], wspace=0.1)

        # Plot GT RGB Image in the left part of the nested grid
        ax_gt_rgb = plt.subplot(gs_top_left[0, 0])
        ax_gt_rgb.imshow(gt_rgb)
        ax_gt_rgb.set_title('Ground Truth RGB', fontsize=16)
        ax_gt_rgb.axis('off')

        # Plot Measurement in the right part of the nested grid
        ax_meas = plt.subplot(gs_top_left[0, 1])
        ax_meas.imshow(input_meas_cpu, cmap='gray')
        ax_meas.set_title('Measurement', fontsize=16)
        ax_meas.axis('off')

        # b) Plot Spectral Curve (Bottom-Left)
        ax1 = plt.subplot(gs[2:4, 0])
        
        # Define a patch in the center to analyze
        h, w = gt_hsi_cpu.shape[1:]
        patch_size = 30
        p_h, p_w = h // 2 - patch_size // 2, w // 2 - patch_size // 2
        patch_gt = gt_hsi_cpu[:, p_h : p_h + patch_size, p_w : p_w + patch_size]
        patch_recon_ours = our_reconstructed_hsi_cpu[
            :, p_h : p_h + patch_size, p_w : p_w + patch_size
        ]
        patch_recon_cassi = cassi_ssl_reconstructed_hsi_cpu[
            :, p_h : p_h + patch_size, p_w : p_w + patch_size
        ]

        # Calculate mean spectrum
        spectrum_gt = np.mean(patch_gt, axis=(1, 2))
        spectrum_recon_ours = np.mean(patch_recon_ours, axis=(1, 2))
        spectrum_recon_cassi = np.mean(patch_recon_cassi, axis=(1, 2))

        # Wavelength axis (assuming 450-650nm range over 28 channels)
        wavelengths = np.linspace(450, 650, gt_hsi_cpu.shape[0])

        ax1.plot(wavelengths, spectrum_gt, "r-", label="Ground Truth")
        ax1.plot(wavelengths, spectrum_recon_ours, "b--", label="Our Model")
        ax1.plot(wavelengths, spectrum_recon_cassi, "g-.", label="CASSI-SSL")
        ax1.set_title("Spectral Signature Comparison", fontsize=16)
        ax1.set_xlabel("Wavelength (nm)", fontsize=12)
        ax1.set_ylabel("Mean Intensity", fontsize=12)
        ax1.legend()
        ax1.grid(True)

        # c) Plot Reconstructed and Ground Truth Bands (Right columns)
        bands_to_show = [5, 12, 19, 26]  # 4 representative bands
        
        for i, band_idx in enumerate(bands_to_show):
            wavelength = wavelengths[band_idx]
            color_filter = np.array(wavelength_to_rgb(wavelength))

            def apply_color_filter(img, color):
                # Normalize image to 0-1 to act as intensity mask
                img_norm = (img - img.min()) / (img.max() - img.min() + 1e-8)
                # Stack to 3 channels and apply color
                colored_img = np.stack([img_norm] * 3, axis=-1) * color
                return np.clip(colored_img, 0, 1)

            # Our Reconstructed Image
            ax_recon_ours = plt.subplot(gs[i, 1])
            recon_band_img_ours = our_reconstructed_hsi_cpu[band_idx]
            colored_img_ours = apply_color_filter(recon_band_img_ours, color_filter)
            ax_recon_ours.imshow(colored_img_ours)
            ax_recon_ours.set_title(f'Our Recon Band {band_idx+1}', fontsize=16)
            ax_recon_ours.axis('off')

            # CASSI-SSL Reconstructed Image
            ax_recon_cassi = plt.subplot(gs[i, 2])
            recon_band_img_cassi = cassi_ssl_reconstructed_hsi_cpu[band_idx]
            colored_img_cassi = apply_color_filter(recon_band_img_cassi, color_filter)
            ax_recon_cassi.imshow(colored_img_cassi)
            ax_recon_cassi.set_title(f'CASSI-SSL Band {band_idx+1}', fontsize=16)
            ax_recon_cassi.axis('off')

            # Ground Truth Image
            ax_gt = plt.subplot(gs[i, 3])
            gt_band_img = gt_hsi_cpu[band_idx]
            colored_img_gt = apply_color_filter(gt_band_img, color_filter)
            ax_gt.imshow(colored_img_gt)
            ax_gt.set_title(f'GT Band {band_idx+1}', fontsize=16)
            ax_gt.axis('off')

        # Adjust layout and save the composite figure
        plt.tight_layout()
        output_path = os.path.join(output_root, f"{file_name}_comparison.png")
        plt.savefig(output_path, dpi=300)
        plt.close(fig)
        print(f"  Saved composite image to {output_path}")

print("\nVisualization complete.")
print(f"Results saved in '{output_root}' directory.")
