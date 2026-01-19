const LitElement = Object.getPrototypeOf(
  customElements.get("ha-panel-lovelace")
);
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

console.info(
  `%c LIGHT-SLIDER-CARD %c v1.0.1 `,
  "color: white; background: #555; font-weight: bold;",
  "color: white; background: #918F8F; font-weight: bold;"
);

class LightSliderCard extends LitElement {
  static properties = {
    hass: {},
    config: {},
    _sliderValue: { state: true },
    _isDragging: { state: true },
    _isExpanded: { state: true },
  };

  static styles = css`
    @import url('https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;700&display=swap');

    :host {
      font-family: 'Karla', sans-serif;
      --card-bg: var(--ha-card-background, #4a4a4a);
      --card-bg-selected: var(--secondary-background-color, #5a5a5a);
      --text-color: var(--primary-text-color, #e0e0e0);
      --border-color: var(--divider-color, #555);
      --slider-bg: var(--secondary-background-color, #5A5A5A);
      --slider-fill: var(--accent-color, #FFF3EC);
      --slider-border: var(--divider-color, #A9A9A9);
    }

    .menu-system {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      gap: 20px;
      cursor: pointer;
    }

    .lamp-status {
      min-width: 200px;
      padding: 10px;
      background: var(--card-bg);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      border-radius: 16px;
      outline: 0.5px var(--border-color) solid;
      outline-offset: -0.5px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-start;
      gap: 12.5px;
      position: relative;
      transition: all 0.3s ease;
    }

    .lamp-status.expanded {
      width: 239px;
      min-width: unset;
      height: 76px;
      background: var(--card-bg-selected);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
      justify-content: center;
    }

    .card-inset-shadow {
      position: absolute;
      inset: 0;
      pointer-events: none;
      border-radius: inherit;
      box-shadow: inset 1px 1px 2px 0px rgba(163, 160, 160, 0.3);
    }

    .title {
      display: inline-flex;
      align-items: center;
      height: 16px;
      padding-left: 12px;
      padding-right: 12px;
      justify-content: flex-start;
    }

    .icon {
      height: 17px;
      min-width: 21px;
      min-height: 17px;
      padding: 1px;
      display: inline-flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 10px;
    }

    .icon svg {
      width: 21px;
      height: 17px;
    }

    .title-wrapper {
      padding-left: 22px;
      padding-right: 22px;
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: flex-start;
    }

    .title-text {
      color: var(--text-color);
      font-size: 14px;
      font-weight: 500;
    }

    .title-text.expanded {
      font-weight: 700;
    }

    .slider {
      align-self: stretch;
      height: 13px;
      background: var(--slider-bg);
      border-radius: 15px;
      outline: 0.5px var(--slider-border) solid;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      cursor: pointer;
      user-select: none;
      overflow: visible;
    }

    .slider-fill {
      height: 13px;
      background: var(--slider-fill);
      border-radius: 20px;
      transition: width 0.1s ease;
    }

    .slider-marker {
      position: absolute;
      cursor: grab;
      z-index: 10;
      top: -4px;
    }

    .slider-marker:active {
      cursor: grabbing;
    }

    .slider-marker svg {
      pointer-events: none;
    }

    /* Child items */
    .child-items {
      display: none;
      justify-content: flex-start;
      align-items: center;
      gap: 20px;
    }

    .child-items.visible {
      display: flex;
    }

    .child-item {
      padding: 10px;
      background: var(--card-bg-selected);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      border-radius: 16px;
      outline: 0.5px var(--border-color) solid;
      outline-offset: -0.5px;
      display: inline-flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-start;
      gap: 12.5px;
    }

    .child-item .title {
      justify-content: center;
    }

    .child-item .title-wrapper {
      justify-content: center;
    }

    .error-message {
      color: #d32f2f;
      padding: 20px;
      border-radius: 4px;
      background: #ffebee;
    }
  `;

  constructor() {
    super();
    this._sliderValue = 50;
    this._isDragging = false;
    this._isExpanded = false;
    this._childSliderValues = {};
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("You need to define an entity");
    }
    this.config = {
      name: 'Light',
      icon: 'desk',
      children: [],
      ...config
    };
  }

  _getEntityBrightness(entityId) {
    const entity = this.hass?.states[entityId];
    if (!entity) return 0;
    if (entity.state === 'off') return 0;
    return Math.round((entity.attributes.brightness || 255) / 255 * 100);
  }

  _handleSliderClick(e, entityId) {
    if (e.target.closest('.slider-marker')) return;
    
    const slider = e.currentTarget;
    const rect = slider.getBoundingClientRect();
    let percentage = (e.clientX - rect.left) / rect.width;
    percentage = Math.max(0.05, Math.min(0.95, percentage));
    
    this._setBrightness(entityId, Math.round(percentage * 100));
  }

  _handleSliderDrag(e, entityId) {
    if (!this._isDragging) return;
    
    const slider = e.currentTarget.closest('.slider');
    if (!slider) return;
    
    const rect = slider.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let percentage = (clientX - rect.left) / rect.width;
    percentage = Math.max(0.05, Math.min(0.95, percentage));
    
    this._setBrightness(entityId, Math.round(percentage * 100));
  }

  _setBrightness(entityId, percentage) {
    if (percentage <= 5) {
      this.hass.callService('light', 'turn_off', {
        entity_id: entityId
      });
    } else {
      this.hass.callService('light', 'turn_on', {
        entity_id: entityId,
        brightness: Math.round(percentage / 100 * 255)
      });
    }
  }

  _handleMenuClick(e) {
    // Don't toggle if clicking on slider
    if (e.target.closest('.slider')) return;
    this._isExpanded = !this._isExpanded;
  }

  _renderIcon(iconType) {
    switch (iconType) {
      case 'desk':
        return html`
          <svg width="21" height="17" viewBox="0 0 21 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.1 6.35714C18.6039 6.35714 19.0872 6.58291 19.4435 6.98477C19.7998 7.38664 20 7.93168 20 8.5V11.1186C20 12.129 19.6441 13.0981 19.0105 13.8126C18.377 14.5272 17.5178 14.9286 16.6218 14.9286H4.3782C3.48225 14.9286 2.62299 14.5272 1.98945 13.8126C1.35592 13.0981 1 12.129 1 11.1186V8.5C1 7.93168 1.20018 7.38664 1.5565 6.98477C1.91282 6.58291 2.39609 6.35714 2.9 6.35714M18.1 6.35714C17.5961 6.35714 17.1128 6.58291 16.7565 6.98477C16.4002 7.38664 16.2 7.93168 16.2 8.5V9.78571C16.2 10.013 16.1199 10.2311 15.9774 10.3918C15.8349 10.5526 15.6416 10.6429 15.44 10.6429H5.56C5.35844 10.6429 5.16513 10.5526 5.0226 10.3918C4.88007 10.2311 4.8 10.013 4.8 9.78571V8.5C4.8 7.93168 4.59982 7.38664 4.2435 6.98477C3.88718 6.58291 3.40391 6.35714 2.9 6.35714M18.1 6.35714C18.1 5.36071 18.1 4.86357 18.0268 4.45C17.8802 3.61858 17.5183 2.85486 16.9868 2.25545C16.4554 1.65603 15.7782 1.24784 15.041 1.0825C14.6743 1 14.2335 1 13.35 1H7.65C6.7665 1 6.3257 1 5.959 1.0825C5.2218 1.24784 4.54464 1.65603 4.01316 2.25545C3.48168 2.85486 3.11975 3.61858 2.97315 4.45C2.9 4.86357 2.9 5.36071 2.9 6.35714M18.1 16V14.9286M2.9 16V14.9286" stroke="#2B2B2B" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        `;
      case 'console-lamp':
        return html`
          <svg width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 8.25V15.75M13.5 8.25V15.75M0.75 8.25H14.25M1.5 12H13.5M6.75 10.125H8.25M7.5 4.5V8.25M9.2895 1.76625C9.212 1.63825 9.142 1.5195 9.0795 1.41C8.892 1.07775 8.7975 0.912 8.6475 0.831C8.4975 0.75 8.298 0.75 7.89825 0.75H7.1025C6.70275 0.75 6.5025 0.75 6.3525 0.831C6.2025 0.912 6.1095 1.0785 5.92125 1.41C5.85318 1.52988 5.78317 1.64864 5.71125 1.76625C4.80975 3.243 4.359 3.981 4.539 4.2405C4.719 4.5 5.565 4.5 7.257 4.5H7.743C9.435 4.5 10.281 4.5 10.461 4.2405C10.641 3.981 10.191 3.243 9.2895 1.76625Z" stroke="#2B2B2B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
      case 'floor-lamp':
        return html`
          <svg width="21" height="16" viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.75 1.30556V4.70425M0.75 1.30556H12.8409M0.75 1.30556L5.93182 0.75H19.75M0.75 4.70425H5.93182M0.75 4.70425V9.63889M12.8409 4.70425V1.30556M12.8409 4.70425L19.75 3.52778M12.8409 4.70425V15.75M12.8409 4.70425H5.93182M12.8409 1.30556L19.75 0.75M19.75 3.52778V0.75M19.75 3.52778V8.52778M19.75 14.0833V8.52778M0.75 15.75V9.63889M5.93182 4.70425V8.52778M5.93182 14.0833V8.52778M0.75 9.63889L5.93182 8.52778M0.75 9.63889H13.7666L19.75 8.52778M5.93182 8.52778H19.75" stroke="#2B2B2B" stroke-width="1.5"/>
          </svg>
        `;
      case 'arch-lamp':
        return html`
          <svg width="19" height="17" viewBox="0 0 19 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 15.75H5.09074M5.09074 15.75H10.1815M5.09074 15.75V2.32895C5.09074 1.45692 5.79766 0.75 6.66969 0.75H13.5844C14.0204 0.75 14.3739 1.10346 14.3739 1.53947V3.90789M14.3739 3.90789H16.9737C17.1917 3.90789 17.3684 4.08462 17.3684 4.30263V8.31316C17.3684 8.53117 17.1917 8.70789 16.9737 8.70789H9.86842C9.65041 8.70789 9.47368 8.53117 9.47368 8.31316V4.30263C9.47368 4.08462 9.65041 3.90789 9.86842 3.90789H14.3739Z" stroke="#2B2B2B" stroke-width="1.5"/>
          </svg>
        `;
      default:
        return html`
          <svg width="21" height="17" viewBox="0 0 21 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10.5" cy="8.5" r="7" stroke="#2B2B2B" stroke-width="1.5"/>
          </svg>
        `;
    }
  }

  _renderSliderMarker() {
    return html`
      <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter_marker)">
          <circle cx="10" cy="10" r="9" fill="#E9E7E7"/>
        </g>
        <defs>
          <filter id="filter_marker" x="0" y="0" width="20" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset/>
            <feGaussianBlur stdDeviation="0.5"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.35 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1" result="shape"/>
          </filter>
        </defs>
      </svg>
    `;
  }

  _renderSlider(entityId) {
    const brightness = this._getEntityBrightness(entityId);
    const fillWidth = Math.max(5, brightness);
    const markerLeft = (fillWidth / 100) * 100 - 5;

    return html`
      <div 
        class="slider"
        @click=${(e) => this._handleSliderClick(e, entityId)}
        @mousedown=${(e) => {
          if (e.target.closest('.slider-marker')) {
            this._isDragging = true;
          }
        }}
        @mousemove=${(e) => this._handleSliderDrag(e, entityId)}
        @mouseup=${() => this._isDragging = false}
        @mouseleave=${() => this._isDragging = false}
        @touchstart=${(e) => {
          if (e.target.closest('.slider-marker')) {
            this._isDragging = true;
          }
        }}
        @touchmove=${(e) => this._handleSliderDrag(e, entityId)}
        @touchend=${() => this._isDragging = false}
      >
        <div class="slider-fill" style="width: ${fillWidth}%"></div>
        <div class="slider-marker" style="left: calc(${fillWidth}% - 10px)">
          ${this._renderSliderMarker()}
        </div>
      </div>
    `;
  }

  render() {
    if (!this.hass) {
      return html`<div class="error-message">Loading...</div>`;
    }

    const entity = this.hass.states[this.config.entity];
    if (!entity) {
      return html`<div class="error-message">Entity not found: ${this.config.entity}</div>`;
    }

    const children = this.config.children || [];

    return html`
      <div class="menu-system" @click=${this._handleMenuClick}>
        <div class="lamp-status ${this._isExpanded ? 'expanded' : ''}">
          <div class="title">
            <div class="icon">
              ${this._renderIcon(this.config.icon)}
            </div>
            <div class="title-wrapper">
              <div class="title-text ${this._isExpanded ? 'expanded' : ''}">${this.config.name}</div>
            </div>
          </div>
          ${this._renderSlider(this.config.entity)}
          <div class="card-inset-shadow"></div>
        </div>

        <div class="child-items ${this._isExpanded ? 'visible' : ''}">
          ${children.map(child => {
            const childEntity = this.hass.states[child.entity];
            if (!childEntity) return '';

            return html`
              <div class="child-item">
                <div class="title">
                  <div class="icon">
                    ${this._renderIcon(child.icon || 'console-lamp')}
                  </div>
                  <div class="title-wrapper">
                    <div class="title-text">${child.name}</div>
                  </div>
                </div>
                ${this._renderSlider(child.entity)}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  getCardSize() {
    return 1;
  }

  static getStubConfig() {
    return {
      entity: 'light.living_room',
      name: 'Living',
      icon: 'desk',
      children: [
        { entity: 'light.table_lamp', name: 'Table Lamp', icon: 'console-lamp' },
        { entity: 'light.floor_lamp', name: 'Floor Lamp', icon: 'floor-lamp' }
      ]
    };
  }
}

if (!customElements.get("light-slider-card")) {
  customElements.define("light-slider-card", LightSliderCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "light-slider-card",
  name: "Light Slider Card",
  description: "A slider card for controlling lights with expandable child lights",
  preview: true,
});
