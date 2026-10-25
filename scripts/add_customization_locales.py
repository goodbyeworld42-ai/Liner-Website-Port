#!/usr/bin/env python3
"""Add settings.customization + cover_glow locale keys to tl.json and id.json.

Mirrors the upstream 290c11d/04d4519 en.json additions for the two website-port
languages (Tagalog, Bahasa Indonesia). Placement mirrors upstream ordering:
- settings.tabs.customization       (after "privacy")
- settings.theme.disabled_for_glass (after "system")
- settings.customization            (after "connection")
- settings.cover_glow               (after "customization")
"""
import json, sys

LOCALES = "/home/z/my-project/liner-app/src/languages/locales"

TL = {
    "tabs_customization": "Customization",
    "disabled_for_glass": "Naka-off ang light theme kapag gumagamit ng custom wallpaper glassmorphism.",
    "customization": {
        "description": "Wallpaper ng background ng window, transparency at block blur effects.",
        "apply_to_overlay": "I-apply sa overlay mini player",
        "apply_to_overlay_desc": "Ipakita ang custom background at glass styling sa floating mini player.",
        "dark_theme_only": "Available lang ang customization sa dark theme",
        "wallpaper_title": "Wallpaper ng Window",
        "wallpaper_description": "Magtakda ng custom na imahe o animated GIF bilang buong background ng window.",
        "upload_title": "Pumili ng imahe o animated GIF",
        "upload_hint": "PNG, JPEG, GIF, WebP (hanggang 30MB)",
        "change_button": "Palitan",
        "remove_button": "Alisin",
        "wallpaper_blur": "Blur ng wallpaper",
        "wallpaper_dim": "Dimming ng wallpaper",
        "blocks_title": "Glassmorphism ng Interface Blocks",
        "blocks_description": "I-adjust ang transparency, backdrop blur at dimming para sa bawat bahagi ng interface.",
        "block_sidebar": "Sidebar",
        "block_content": "Content View",
        "block_miniplayer": "Miniplayer",
        "opacity": "Opacity (transparency)",
        "opacity_desc": "Antas ng opacity ng background (min. 25%)",
        "blur": "Backdrop blur",
        "blur_desc": "Tindi ng frosted glass blur",
        "dim": "Dimming",
        "dim_desc": "Madilim na overlay para mas madaling mabasa",
        "apply_all": "Sa lahat",
        "apply_all_title": "I-apply ang settings sa lahat ng blocks",
        "applied_to_all": "Na-apply ang settings sa lahat ng blocks",
        "reset_block": "I-reset",
        "block_reset": "Na-reset ang block settings",
        "reset_all": "I-reset lahat ng customization",
        "reset_all_desc": "Ibalik ang default na itsura, burahin ang background image at block glass effects.",
        "all_reset": "Na-reset lahat ng customization",
        "applied": "Na-apply ang wallpaper",
        "removed": "Inalis ang wallpaper",
        "invalid_file_type": "Pumili ng image o GIF file",
        "file_too_large": "Dapat mas maliit sa 30 MB ang file",
        "read_error": "Nabigo ang pagbasa ng image file",
    },
    "cover_glow": {
        "title": "Cover glow",
        "description": "Blurred artwork glow sa likod ng mga pahina. I-off para sa simpleng background.",
        "disabled_for_wallpaper": "Naka-off habang may custom wallpaper.",
    },
}

ID = {
    "tabs_customization": "Kustomisasi",
    "disabled_for_glass": "Tema terang dinonaktifkan saat menggunakan glassmorphism wallpaper kustom.",
    "customization": {
        "description": "Wallpaper latar jendela, transparansi, dan efek blur blok.",
        "apply_to_overlay": "Terapkan ke mini player overlay",
        "apply_to_overlay_desc": "Tampilkan latar kustom dan gaya kaca pada mini player mengambang.",
        "dark_theme_only": "Kustomisasi hanya tersedia untuk tema gelap",
        "wallpaper_title": "Wallpaper Jendela",
        "wallpaper_description": "Atur gambar kustom atau GIF animasi sebagai latar jendela penuh.",
        "upload_title": "Pilih gambar atau GIF animasi",
        "upload_hint": "PNG, JPEG, GIF, WebP (hingga 30MB)",
        "change_button": "Ubah",
        "remove_button": "Hapus",
        "wallpaper_blur": "Blur wallpaper",
        "wallpaper_dim": "Peredupan wallpaper",
        "blocks_title": "Glassmorphism Blok Antarmuka",
        "blocks_description": "Sesuaikan transparansi, blur latar, dan peredupan untuk setiap area antarmuka.",
        "block_sidebar": "Sidebar",
        "block_content": "Tampilan Konten",
        "block_miniplayer": "Miniplayer",
        "opacity": "Opasitas (transparansi)",
        "opacity_desc": "Tingkat opasitas latar (min. 25%)",
        "blur": "Blur latar",
        "blur_desc": "Intensitas blur kaca buram",
        "dim": "Peredupan",
        "dim_desc": "Overlay gelap untuk keterbacaan lebih baik",
        "apply_all": "Ke semua",
        "apply_all_title": "Terapkan pengaturan ke semua blok",
        "applied_to_all": "Pengaturan diterapkan ke semua blok",
        "reset_block": "Reset",
        "block_reset": "Pengaturan blok direset",
        "reset_all": "Reset semua kustomisasi",
        "reset_all_desc": "Kembalikan tampilan bawaan, hapus gambar latar dan efek kaca blok.",
        "all_reset": "Semua kustomisasi direset",
        "applied": "Wallpaper diterapkan",
        "removed": "Wallpaper dihapus",
        "invalid_file_type": "Pilih file gambar atau GIF",
        "file_too_large": "Ukuran file harus di bawah 30 MB",
        "read_error": "Gagal membaca file gambar",
    },
    "cover_glow": {
        "title": "Cover glow",
        "description": "Cahaya karya seni buram di belakang halaman. Matikan untuk latar polos.",
        "disabled_for_wallpaper": "Nonaktif selama wallpaper kustom dipasang.",
    },
}


def insert_after(section: dict, anchor: str, key: str, value) -> None:
    """Insert key=value after anchor, or append if anchor missing."""
    if key in section:
        section[key] = value
        return
    if anchor in section:
        items = list(section.items())
        out = {}
        for k, v in items:
            out[k] = v
            if k == anchor:
                out[key] = value
        section.clear()
        section.update(out)
    else:
        section[key] = value


def apply(path: str, tr: dict) -> None:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    settings = data["settings"]

    insert_after(settings["tabs"], "privacy", "customization", tr["tabs_customization"])
    insert_after(settings["theme"], "system", "disabled_for_glass", tr["disabled_for_glass"])

    # rebuild settings so customization/cover_glow land right after connection
    cust, glow = tr["customization"], tr["cover_glow"]
    settings.pop("customization", None)
    settings.pop("cover_glow", None)
    out = {}
    for k, v in settings.items():
        out[k] = v
        if k == "connection":
            out["customization"] = cust
            out["cover_glow"] = glow
    if "customization" not in out:  # no connection anchor -> append
        out["customization"], out["cover_glow"] = cust, glow
    data["settings"] = out

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    # verify parity with en.json
    en = json.load(open(f"{LOCALES}/en.json", encoding="utf-8"))
    for sect in ("customization", "cover_glow"):
        en_keys = set(en["settings"][sect])
        tl_keys = set(data["settings"][sect])
        assert en_keys == tl_keys, f"{path}: {sect} mismatch {en_keys ^ tl_keys}"
    assert "customization" in data["settings"]["tabs"]
    assert "disabled_for_glass" in data["settings"]["theme"]
    print(f"OK {path}")


apply(f"{LOCALES}/tl.json", TL)
apply(f"{LOCALES}/id.json", ID)
print("done")
