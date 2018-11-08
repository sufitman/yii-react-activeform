/* @flow */
import * as React from "react";

export type TemplatePartLabel = 'label' | 'input' | 'hint' | 'error';

export type LabelOptions = { htmlFor?: string };

export type TemplateParts = { [label: TemplatePartLabel]: React.Element<any>};

export type FieldProps = {
  attribute: string,
  options?: {},
  inputOptions?: {},
  errorOptions?: {},
  labelOptions?: LabelOptions,
  hintOptions?: {},
  enclosedByLabel?: boolean,
  template?: (content: TemplateParts) => React.Node,
  label?: ?string,
  id?: string,
  hint?: ?string,
  enableClientValidation?: boolean,
  enableAjaxValidation?: boolean,
  validateOnChange?: boolean,
  validateOnBlur?: boolean,
  validationDelay?: number,
  required?: boolean,
  addAriaAttributes?: boolean,
};

export type UpdateAttributeCallback = (attribute: string, attributeData: AttributeData, validate: boolean) => Promise<*>;

export type InputRenderer = (id: string, attributeData: AttributeData, updateAttribute?: ?UpdateAttributeCallback) => ?React.Element<any>;

export type ActiveFieldProps = { input: InputRenderer } & FieldProps;

export type ValidationOptions = {
  enableClientValidation: boolean,
  enableAjaxValidation: boolean,
  validateOnChange: boolean,
  validateOnBlur: boolean,
  validateOnType: boolean,
  validationDelay: number,
};

export type ValidatorCallback = (value: any, options?: {}) => string;

export type ValidatorObject = { validator: string, options?: {} };

export type AttributeData = {
  type?: string,
  label?: string,
  hint?: string,
  errors?: Array<string>,
  value?: mixed,
  rules?: Array<ValidatorObject|ValidatorCallback>,
  options?: ValidationOptions
};

export type Model = {[attribute: string]: AttributeData};

export type ActiveFormContextProps = {
  successCssClass: string,
  errorCssClass: string,
  enableClientValidation: boolean,
  enableAjaxValidation: boolean,
  validateOnChange: boolean,
  validateOnBlur: boolean,
  validateOnSubmit: boolean,
  validateOnType: boolean,
  validationDelay: number,
  formId: string,
  model: Model,
  updateAttribute?: UpdateAttributeCallback,
  addFieldRef?: (attribute: string, ref: {current: any}) => void,
  setHasFile?: () => void,
};

export type InputProps = FieldProps & {
  type?: ?string,
  tag?: string,
  onInputChange?: (val?: mixed, checked?: bool) => any;
  optionValue?: ?mixed;
};

export type SelectOptions = {[value: string]: string | {[subvalue: string]: string}};

export type SelectProps = { multiple?: boolean, data: SelectOptions, prompt?: string } & FieldProps;

type Formatter = (idx: number, label: string, name: string, checked: boolean, value: mixed) => React.Node;

export type ListProps = FieldProps & {
  formatter?: ?Formatter,
  itemOptions?: { [key: string]: mixed },
  encode?: boolean,
  tag: string,
  items?: {[val: string]: string},
  type?: string,
  tag?: void,
  multiple?: boolean,
};

export type FormData = {[attr: string]: any};