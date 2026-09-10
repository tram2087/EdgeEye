import urllib.request
import zipfile
import os
import shutil

def setup():
    url = "https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip"
    zip_path = "node.zip"
    target_dir = os.path.abspath("nodejs")
    
    if os.path.exists(os.path.join(target_dir, "node.exe")):
        print(f"Node.js already present at {target_dir}")
        return

    print("Downloading portable Node.js LTS from official source...")
    urllib.request.urlretrieve(url, zip_path)
    print("Download complete. Extracting archive...")
    with zipfile.ZipFile(zip_path, 'r') as z:
        z.extractall(".")
    
    extracted_folder = "node-v20.18.0-win-x64"
    if os.path.exists(extracted_folder):
        if os.path.exists(target_dir):
            shutil.rmtree(target_dir)
        shutil.move(extracted_folder, target_dir)
    
    if os.path.exists(zip_path):
        os.remove(zip_path)
    print("Node.js setup successful!")

if __name__ == "__main__":
    setup()
