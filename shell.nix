{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  name = "dev-env-DEX-TP4";

  buildInputs = [
   # pkgs.git                   # Git for version control
    pkgs.nodejs-18_x           # Explicitly specify Node.js version 18.x
    pkgs.nodePackages.npm      # npm, the Node.js package manager
    pkgs.nodePackages.yarn     # Yarn for managing Scaffold-ETH dependencies
   # pkgs.vscode                # Optional: Visual Studio Code
    pkgs.python3               # Optional: Required if Scaffold-ETH uses Python scripts
  ];

  shellHook = ''
    echo "Smart contract development environment configured"
    echo "Use 'yarn' for Scaffold-ETH and install other tools like ethers.js or hardhat as needed."
  '';
}
