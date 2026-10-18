from PyInstaller.utils.hooks import collect_all

datas, binaries, hiddenimports = collect_all("faster_whisper")
ct_datas, ct_binaries, ct_hiddenimports = collect_all("ctranslate2")

a = Analysis(
    ["sermon_studio/__main__.py"],
    pathex=["."],
    binaries=binaries + ct_binaries,
    datas=datas + ct_datas,
    hiddenimports=hiddenimports + ct_hiddenimports,
)
pyz = PYZ(a.pure)
exe = EXE(pyz, a.scripts, [], exclude_binaries=True, name="sermon-studio", console=True)
coll = COLLECT(
    exe, a.binaries, a.datas,
    strip=False,
    upx=False,
    name="sermon-studio",
)
