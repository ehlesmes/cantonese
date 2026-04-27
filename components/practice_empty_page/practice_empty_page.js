import { BasePage } from "../shared/page.js";
import { PageRegistry } from "../shared/page_registry.js";

export class PracticeEmptyPage extends BasePage {
  constructor() {
    super({}, [], import.meta.url, {
      primaryText: "Go Home",
    });

    const title = this.html("h1", { textContent: "No exercises yet!" });
    this.contentWrapper.appendChild(title);

    const message = this.html("p", {
      textContent:
        "Complete some lessons first to add exercises to your practice queue.",
    });
    this.contentWrapper.appendChild(message);
  }

  handlePrimaryClick() {
    this.dispatch("go-home");
  }
}

PageRegistry.set("practice-empty", PracticeEmptyPage);
