<div align="center">
  <img src="https://github.com/tapframe/NuvioTV/raw/main/assets/brand/app_logo_wordmark.png" alt="NuvioTV Web" width="300" />
  <br />
  <br />
  <p>
    A modern smart TV media player for Samsung Tizen and LG webOS powered by the Stremio addon ecosystem.
    <br />
    Stremio addon ecosystem • Tizen • webOS • TV optimized • Playback-focused experience
  </p>
</div>

About

NuvioTV Web is a modern media player designed specifically for Samsung Tizen and LG webOS TVs.

It acts as a client-side playback interface that can integrate with the Stremio addon ecosystem for content discovery and source resolution through user-installed extensions.

Built as a shared web app and optimized for a TV-first viewing experience, remote-control navigation, and platform-specific playback behavior.

Installation

Nuvio WebTV Installer

Download the latest Windows or macOS installer from GitHub Releases.

The installer can connect to supported Samsung Tizen and LG webOS TVs and install the latest .wgt and .ipk packages automatically.

Samsung Tizen

TizenBrew

* Open TizenBrew on your Samsung TV.
* Add the GitHub module NuvioMedia/NuvioTVTizen.
* Launch Nuvio TV from your installed modules.

Manual Install

Download the latest .wgt package from GitHub Releases and install it using your preferred Samsung Tizen development workflow.

LG webOS

Homebrew Channel

* Open Homebrew Channel on your LG webOS TV.
* Go to Settings.
* Choose Add repository.
* Enter https://raw.githubusercontent.com/NuvioMedia/NuvioTVWebOS/main/webosbrew/apps.json.
* Return to the apps list and install Nuvio TV.

Manual Install

Download the latest .ipk package from GitHub Releases.

Enable Developer Mode and Key Server by following the webOS Homebrew Developer Mode guide, then install the package with webOS Dev Manager.

Development

Prerequisites

* Node.js
* npm
* Python 3
* Tizen Studio, for manual Tizen packaging or installation
* webOS CLI tools, for manual webOS packaging or installation

Setup

git clone https://github.com/NuvioMedia/NuvioWeb.git
cd NuvioWeb
npm install

Run Locally

npm run build
python3 -m http.server 8080 -d dist

Open http://127.0.0.1:8080.

Build webOS Package

npm run package:webos

Install on a configured LG webOS TV:

npm run install:webos -- -d lg

Useful webOS commands:

npm run inspect:webos -- -d lg
npm run logs:webos -- -d lg

Build Tizen Package

npm run package:tizen

This creates a .wgt package in the repository root.

Default identifiers:

* Tizen package id: NuvioTV
* Tizen application id: NuvioTV.NuvioTV

Override them when needed:

TIZEN_PACKAGE_ID=NuvioTV TIZEN_APP_ID=NuvioTV.NuvioTV npm run package:tizen

Project Structure

* js/ app logic, UI screens, platform adapters, and player code
* css/ shared styling and TV layout rules
* assets/ icons, branding, and bundled assets
* docs/ static runtime helper pages used by the app
* scripts/ build, packaging, sync, and metadata tooling
* dist/ generated build output

Platform Repositories

* TizenBrew wrapper: NuvioMedia/NuvioTVTizen
* webOS metadata repository: NuvioMedia/NuvioTVWebOS
* Desktop installer: NuvioMedia/NuvioWebTVInstaller

Origins / Credits

This project is part of the Nuvio TV ecosystem and builds on important community work:

* tapframe/NuvioTV
    The original Android TV project that shaped the TV-first product direction.
    https://github.com/tapframe/NuvioTV
* WhiteGiso/NuvioTV-WebOS
    The community webOS codebase that served as an early inspiration and base for this shared web version.
    https://github.com/WhiteGiso/NuvioTV-WebOS

Legal & DMCA

NuvioTV Web functions solely as a client-side interface for browsing metadata and playing media provided by user-installed extensions and/or user-provided sources. It is intended for content the user owns or is otherwise authorized to access.

NuvioTV Web is not affiliated with any third-party extensions, catalogs, sources, or content providers. It does not host, store, or distribute any media content.

For comprehensive legal information, including our full disclaimer, third-party extension policy, and DMCA/Copyright information, please visit our Legal & Disclaimer Page.

Built With

* JavaScript
* HTML
* CSS
* Samsung Tizen Web APIs
* LG webOS APIs
* Node.js
* Stremio addon ecosystem

Star History

<a href="https://www.star-history.com/#NuvioMedia/NuvioWeb&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=NuvioMedia/NuvioWeb&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=NuvioMedia/NuvioWeb&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=NuvioMedia/NuvioWeb&type=date&legend=top-left" />
 </picture>
</a>
<!-- MARKDOWN LINKS & IMAGES -->
