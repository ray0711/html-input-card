/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
  getLovelace,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import type { TimeInputCardConfig } from './types';
import { actionHandler } from './action-handler-directive';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';

/* eslint no-console: 0 */
console.info(
  `%c  TimeInput-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'timeinput-card',
  name: 'TimeInput Card',
  description: 'A time input card using the input type = time',
});

@customElement('timeinput-card')
export class TimeInputCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./editor');
    return document.createElement('timeinput-card-editor');
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  // TODO Add any properities that should cause your element to re-render here
  // https://lit.dev/docs/components/properties/
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: TimeInputCardConfig;

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig(config: TimeInputCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = {
      name: config.entity,
      ...config,
    };
  }

  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult | void {
    // TODO Check for stateObj or other necessary things and render a warning if missing
    if (!this.config.entity) {
      return this._showWarning(localize('common.show_warning'));
    }

    if (this.config.show_error) {
      return this._showError(localize('common.show_error'));
    }

    const stateObj = this.hass.states[this.config.entity];
    const stateStrFull = stateObj ? stateObj.state : '';
    const stateSplit = stateStrFull.split(":");
    const stateStrHHMM = `${stateSplit[0]}:${stateSplit[1]}`;
    const stateDisplay = this.config.show_seconds ? stateStrFull : stateStrHHMM;
    const step = this.config.show_seconds ? 1 : 60;

    return html`
      <ha-card>
        <div class="card-content">
          <hui-generic-entity-row .hass=${this.hass} .config=${this.config}>
            <div class="time-input-wrap">
              <input class="text-content" type="time" step="${step}" value="${stateDisplay}" @change=${this._update}></input>
            </div>
          </hui-generic-entity-row>
        </div>
      </ha-card>
    `;
  }

  private _update(event) {
    const newValue = event.srcElement.value;
    if (this.hass && this.config && this.config.entity) {
      this.hass.callService("input_datetime", "set_datetime", { entity_id: this.config.entity, time: newValue })
    }
  }

  private _showWarning(warning: string): TemplateResult {
    return html`<hui-warning>${warning}</hui-warning>`;
  }

  private _showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card');
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });

    return html`${errorCard}`;
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return css``;
  }
}
