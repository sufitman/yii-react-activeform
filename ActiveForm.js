/* @flow */
import * as React from "react";
import ReactDOM from "react-dom";
import { ActiveFormContext } from './ActiveFormContext'
import inputs from './inputs';
import type {
  ActiveFormContextProps,
  AttributeData,
  ValidatorCallback,
  Model,
  ValidatorObject,
  FormData,
} from "./flow-typed/yiiAFLibDef";
import Validators from './validators';
import ErrorSummary from "./ErrorSummary";

type ActiveFormProps = {
  action?: string,
  options: {},
  errorCssClass: string,
  successCssClass: string,
  enableClientValidation: boolean,
  enableAjaxValidation: boolean,
  validateOnSubmit: boolean,
  validateOnChange: boolean,
  validateOnBlur: boolean,
  validateOnType: boolean,
  validationDelay: number,
  scrollToError: boolean,
  scrollToErrorOffset: number,
  children: any,
  id?: string,
  customFields: { [type: string]: typeof React.Component },
  fields: { [attribute: string]: { type: string, props?: {} } },
  model: Model,
  customValidators: { [name: string]: ValidatorObject | ValidatorCallback },
  onFormSubmit: (formData: FormData) => void,
  onAjaxValidate: (formData: FormData) => Promise<{ [attribute: string]: Array<string> }>,
  enableErrorSummary: bool,
  errorSummaryOptions: {},
  submitButtonText?: string,
  submitButtonOptions: {},
};


type ActiveFormState = {
  model: Model,
};

export default class ActiveForm extends React.Component<ActiveFormProps, ActiveFormState> {
  static defaultProps = {
    errorCssClass: 'has-error',
    successCssClass: 'has-success',
    enableClientValidation: true,
    enableAjaxValidation: false,
    validateOnSubmit: true,
    validateOnChange: true,
    validateOnBlur: true,
    validateOnType: false,
    validationDelay: 500,
    scrollToError: true,
    scrollToErrorOffset: 0,
    options: {},
    customValidators: {},
    fields: {},
    customFields: {},
    enableErrorSummary: false,
    errorSummaryOptions: {},
    submitButtonOptions: { className: 'btn btn-primary'}
  };

  fieldRefs: {[attribute: string]: { current: any }} = {};
  encType: ?string;
  hasFile: boolean = false;

  constructor(props: ActiveFormProps) {
    super(props);
    this.state = {
      model: this.props.model,
    }
  }

  _model = this.props.model;
  id = this.props.id || require('random-string')();
  _ajaxCalls: { currentTimeout: ?TimeoutID, promiseResolves: Array<*> } = {
    currentTimeout: null,
    promiseResolves: []
  };

  _getFormData = (): FormData => {
    const formData = {};
    Object.keys(this._model).forEach(attr => {
      formData[attr] = this._model[attr].value;
    });
    return formData
  };

  updateAttribute  = async (attribute: string, attributeData: AttributeData, validate: boolean = false) => {
    this._model = {
      ...this.state.model,
      ...{
        [attribute]: {
          ...this.state.model[attribute],
          ...attributeData
        }
      }
    };
    if (validate) {
      await this.validateAttribute(attribute);
    }
    this.setState({ model: this._model }, this.scrollToFirstError);
  };

  validateAttribute = async (attribute: string) => {
    const attributeData = this._model[attribute];
    attributeData.errors = [];
    let errors: Array<string> = [];

    if (attributeData.options && attributeData.options.enableClientValidation) {
      const clientValidationErrors = await this.validateClient(attributeData);
      errors = await Promise.all(errors.concat(clientValidationErrors));
    }

    if (this.props.enableAjaxValidation) {
      const ajaxPerformed = await new Promise((resolve) => {
        if (this._ajaxCalls.currentTimeout) {
          clearTimeout(this._ajaxCalls.currentTimeout);
          this._ajaxCalls.promiseResolves.forEach((resolve, idx, promiseResolves) => {
            attributeData.errors = [];
            resolve(false);
            delete promiseResolves[idx];
          })
        }
        this._ajaxCalls.promiseResolves.push(resolve);
        this._ajaxCalls.currentTimeout = setTimeout(
          async () => {
            await this.validateAjax();
            resolve(true);
          },
          this.props.validationDelay
        );
      });

      if (ajaxPerformed) {
        if (attributeData.options && !attributeData.options.enableAjaxValidation) {
          attributeData.errors = [];
        }
        errors = await Promise.all(errors.concat(attributeData.errors || []));
      }
    }

    attributeData.errors = errors;
  };

  validateModel = async () => {
    const attributes = Object.keys(this._model);
    await Promise.all(
      attributes.map(async (attr) => await this.validateAttribute(attr))
    );

    await this.setState({ model: this._model }, this.scrollToFirstError);

    let hasErrors = false;
    attributes.forEach(attr => {
      const errors = this._model[attr].errors;
      if (Array.isArray(errors) && errors.length) {
        hasErrors = true;
      }
    });
    return hasErrors;
  };

  validateClient = async (attributeData: AttributeData): Promise<Array<string>> => {
    if (!attributeData.rules) {
      return [];
    }
    let errors = [];
    await Promise.all(attributeData.rules.map(async (rule: ValidatorObject | ValidatorCallback) => {
      let message;
      if (typeof rule === 'object') {
        const validator = Validators[rule.validator] || this.props.customValidators[rule.validator];
        if (validator && typeof validator === 'function') {
          message = await validator(attributeData.value, rule.options);
        }
      }
      if (typeof rule === 'function') {
        message = await rule(attributeData.value);
      }
      if (message) {
        if (Array.isArray(message)) {
          errors = [ ...errors, ...message ];
        } else {
          errors.push(message);
        }
      }
    }));
    return errors;
  };

  validateAjax = async () => {
    const errors = await this.props.onAjaxValidate(this._getFormData());
    Object.keys(errors).forEach(attribute => {
      if (this._model[attribute]) {
        this._model[attribute].errors = errors[attribute];
      }
    })
  };

  submitForm = (e: SyntheticEvent<*>) => {
    if (this.props.action) {
      return true;
    }
    e.preventDefault();
    const formData = this._getFormData();
    if (this.props.validateOnSubmit) {
      this.validateModel().then((hasErrors) => {
        if (!hasErrors) {
          this.props.onFormSubmit(formData)
        }
      });
    } else {
      this.props.onFormSubmit(formData);
    }
  };

  addFieldRef = (attribute: string, ref: { current: any }) => {
    if (!this.fieldRefs[attribute]) {
      this.fieldRefs[attribute] = ref;
    }
  };

  scrollToFirstError = () => {
    if (!this.props.scrollToError) {
      return;
    }
    let firstErrorAttribute;
    Object.keys(this.state.model).forEach(attribute => {
      if (!firstErrorAttribute && Array.isArray(this.state.model[attribute].errors) && this.state.model[attribute].errors.length) {
        firstErrorAttribute = attribute;
      }
    });
    if (firstErrorAttribute) {
      const ref = this.fieldRefs[firstErrorAttribute];
      if (!ref) {
        return;
      }
      const el: ?{offsetTop?: number} = ReactDOM.findDOMNode(ref.current);
      if (el && typeof el.offsetTop !== 'undefined') {
        window.scrollTo({left: 0, top: el.offsetTop - this.props.scrollToErrorOffset, behavior: 'smooth'})
      }
    }
  };

  setHasFile = () => {
    if (!this.hasFile) {
      this.hasFile = true;
      this.encType = 'multipart/form-data';
    }
  };

  render() {
    let formProps = {
      action: this.props.action,
      id: this.id,
      encType: this.encType,
      onSubmit: this.submitForm,
      ...this.props.options
    };

    const contextProps: ActiveFormContextProps = {
      errorCssClass: this.props.errorCssClass,
      successCssClass: this.props.successCssClass,
      enableClientValidation: this.props.enableClientValidation,
      enableAjaxValidation: this.props.enableAjaxValidation,
      validateOnBlur: this.props.validateOnBlur,
      validateOnChange: this.props.validateOnChange,
      validationDelay: this.props.validationDelay,
      validateOnSubmit: this.props.validateOnSubmit,
      validateOnType: this.props.validateOnType,
      formId: this.id,
      model: this.state.model,
      updateAttribute: this.updateAttribute,
      addFieldRef: this.addFieldRef,
      setHasFile: this.setHasFile,
    };

    let children: Array<?React.Element<any>> = [];
    if (this.props.fields) {
      Object.keys(this.props.fields).forEach((attribute, idx) => {
        const field = this.props.fields[attribute];
        const customFields = this.props.customFields;
        let Tag = inputs[field.type];
        if (!Tag) {
          if (customFields && customFields[field.type]) {
            Tag = customFields[field.type];
          } else {
            throw new Error(`Custom field '${field.type}' not found`);
          }
        }

        if (Tag) {
          children.push(<Tag attribute={ attribute } key={ `${field.type}-${idx}` } { ...field.props } />);
        }
      });
      if (this.props.enableErrorSummary) {
        children.push(<ErrorSummary { ...this.props.errorSummaryOptions }/>)
      }
      children.push(<button key={ `${this.id}-submit-button` } type="submit" { ...this.props.submitButtonOptions }>{ this.props.submitButtonText || 'Submit' }</button>)
    } else {
      children = this.props.children;
    }
    return (
      <ActiveFormContext.Provider value={ contextProps }>
        <form { ...formProps }>{ children }</form>
      </ActiveFormContext.Provider>
    );
  }
}
