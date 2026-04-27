import mandatoryLifecycle from "./rules/mandatory-lifecycle.js";
import mandatorySuperUrl from "./rules/mandatory-super-url.js";
import noGlobalDocument from "./rules/no-global-document.js";
import eventRegistrationLocality from "./rules/event-registration-locality.js";
import dispatchStandard from "./rules/dispatch-standard.js";
import preferProperties from "./rules/prefer-properties.js";
import stylesheetAdoption from "./rules/stylesheet-adoption.js";
import namingAlignment from "./rules/naming-alignment.js";
import testIsolation from "./rules/test-isolation.js";
import testValidationBlock from "./rules/test-validation-block.js";
import testEventVerification from "./rules/test-event-verification.js";
import testDataMocking from "./rules/test-data-mocking.js";

export const rules = {
  "mandatory-lifecycle": mandatoryLifecycle,
  "mandatory-super-url": mandatorySuperUrl,
  "no-global-document": noGlobalDocument,
  "event-registration-locality": eventRegistrationLocality,
  "dispatch-standard": dispatchStandard,
  "prefer-properties": preferProperties,
  "stylesheet-adoption": stylesheetAdoption,
  "naming-alignment": namingAlignment,
  "test-isolation": testIsolation,
  "test-validation-block": testValidationBlock,
  "test-event-verification": testEventVerification,
  "test-data-mocking": testDataMocking,
};
