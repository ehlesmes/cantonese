import { Component } from "./component.js";
import { LessonFooter } from "../lesson_footer/lesson_footer.js";

/**
 * Base class for learning pages (Reading, Unscramble, Explanation, etc.)
 * Provides a standard layout with a main content area and a LessonFooter.
 */
export class BasePage extends Component {
  /**
   * @param {Object} data - Page data
   * @param {string[]} requiredProps - Properties to validate
   * @param {string} baseUrl - Base URL for styles
   * @param {Object} [footerConfig] - Configuration for the LessonFooter
   * @param {string} [footerConfig.primaryText="Continue"]
   * @param {string} [footerConfig.secondaryText]
   * @param {boolean} [footerConfig.primaryDisabled=false]
   */
  constructor(
    data,
    requiredProps,
    baseUrl,
    footerConfig = { primaryText: "Continue" },
  ) {
    super(baseUrl);
    this.validate(data, requiredProps);

    this.render(footerConfig);
    this.setupEventListeners();
    this.renderContent(data);
  }

  render(footerConfig) {
    // Layout containers
    this.container = this.html("div", { className: "page-container" });
    this.main = this.html("main");
    this.contentWrapper = this.html("div", { className: "content-wrapper" });

    this.main.appendChild(this.contentWrapper);
    this.container.appendChild(this.main);

    // Initialize footer with provided config
    this.footer = new LessonFooter(footerConfig);
    this.footer.element.id = "footer";
    this.container.appendChild(this.footer.element);

    this.shadowRoot.appendChild(this.container);
  }

  setupEventListeners() {
    // Standard footer event forwarding
    this.element.addEventListener("primary-click", () =>
      this.handlePrimaryClick(),
    );
    this.element.addEventListener("secondary-click", () =>
      this.handleSecondaryClick(),
    );
  }

  /**
   * Subclasses should override this to render their specific content.
   * @param {Object} data
   */
  renderContent() {}

  /**
   * Subclasses should override this to handle primary button clicks.
   */
  handlePrimaryClick() {}

  /**
   * Subclasses should override this to handle secondary button clicks.
   */
  handleSecondaryClick() {}
}
