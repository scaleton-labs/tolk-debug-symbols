# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Extracting symbols for source code using `#include "...";`

## [0.1.3] - 2023-10-23

### Added

- Extracting constants.

### Fixed

- Extracting debug symbols from code without a single globals.

## [0.1.2] - 2023-10-22

### Fixed

- Hash calculation for `inline_ref` functions

## [0.1.1] - 2023-10-22

### Fixed

- Formatting `cellHash`

## [0.1.0] - 2023-10-20

### Added

- Collecting metadata about all procedures (name, cell hash and `method_id`)
- Collecting metadata about all globals (name, index)

## [0.0.1]

⚡️ Initial release
