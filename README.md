# Light Slider Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)

A custom Home Assistant Lovelace card for controlling lights with a beautiful slider interface and expandable child lights.

## Features

- Sleek slider control for light brightness
- Click to expand and reveal child lights
- Multiple icon options (desk, console-lamp, floor-lamp, arch-lamp)
- Overlay blend mode for visual effect
- Touch and mouse drag support

## Installation

### HACS (Recommended)

1. Open HACS in your Home Assistant
2. Go to "Frontend" section
3. Click the three dots menu → "Custom repositories"
4. Add this repository URL with category "Dashboard"
5. Install "Light Slider Card"
6. Restart Home Assistant

### Manual Installation

1. Download `light-slider-card.js`
2. Copy to `/config/www/light-slider-card.js`
3. Add resource in Lovelace:
   ```yaml
   resources:
     - url: /local/light-slider-card.js
       type: module
   ```

## Configuration

```yaml
type: custom:light-slider-card
entity: light.living_room
name: Living
icon: desk
children:
  - entity: light.table_lamp
    name: Table Lamp
    icon: console-lamp
  - entity: light.floor_lamp
    name: Floor Lamp
    icon: floor-lamp
  - entity: light.arch_lamp
    name: Arch Lamp
    icon: arch-lamp
```

## Options

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `entity` | string | Yes | Light entity ID for the main slider |
| `name` | string | No | Display name (default: 'Light') |
| `icon` | string | No | Icon type: `desk`, `console-lamp`, `floor-lamp`, `arch-lamp` |
| `children` | array | No | List of child light configurations |
| `children[].entity` | string | Yes | Light entity ID for child |
| `children[].name` | string | Yes | Display name for child |
| `children[].icon` | string | No | Icon type for child |

## Icon Types

- `desk` - Couch/sofa icon
- `console-lamp` - Table lamp icon
- `floor-lamp` - Floor lamp icon  
- `arch-lamp` - Arch floor lamp icon
