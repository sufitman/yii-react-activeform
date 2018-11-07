/* @flow */
import * as React from "react";
import type {InputProps, AttributeData, UpdateAttributeCallback} from "./flow-typed/yiiAFLibDef";
import ActiveField from "./ActiveField";
import { withoutLabel } from "./inputs";

export default class Input extends React.Component<InputProps> {
  static defaultProps = {
    inputOptions: {'className': 'form-control'},
    enclosedByLabel: false,
  };

  getCallback = (updateAttribute?: ?UpdateAttributeCallback, attributeData: AttributeData, validate: boolean) => (e: SyntheticEvent<*>) => {
    let value;
    if (this.props.type === 'checkbox') {
      value = e.currentTarget.checked;
    } else if (this.props.type === 'radio') {
      value = this.props.optionValue;
    } else if (this.props.type === 'file') {
      value = e.currentTarget.files;
    } else {
      value = e.currentTarget.value;
    }

    updateAttribute && updateAttribute(this.props.attribute, { ...attributeData, value }, validate);
  };

  getInput = (id: string, attributeData: AttributeData, updateAttribute?: ?UpdateAttributeCallback): React.Element<any> => {
    const Tag = this.props.tag || 'input';
    const type = this.props.type;
    let props: {[key: string]: any} = {
      name: this.props.attribute,
      key: id,
      type,
      id,
      ...this.props.inputOptions
    };

    let validateOnChange = attributeData.options.validateOnChange;
    if (this.props.type === 'checkbox') {
      props.checked = attributeData.value || false;
    } else if (this.props.type === 'radio') {
      props.checked = this.props.optionValue === attributeData.value;
    } else if (this.props.type === 'file') {
      props.files = attributeData.value;
    } else {
      props.value = attributeData.value || '';
      validateOnChange = attributeData.options.validateOnType
    }
    if (Array.isArray(attributeData.errors) && attributeData.errors.length) {
      props['aria-invalid'] = true;
    }
    if (this.props.required) {
      props['aria-required'] = true;
    }

    return <Tag
      { ...props }
      onChange={ this.getCallback(updateAttribute, attributeData, validateOnChange) }
      onBlur={ this.getCallback(updateAttribute, attributeData, attributeData.options.validateOnBlur) }
    />;
  };

  render(): React.Node {
    const fieldProps = { ...this.props, input: this.getInput };
    if (this.props.enclosedByLabel) {
      return <label>
        <ActiveField { ...withoutLabel(fieldProps) } />{ this.props.label }
      </label>
    }
    return <ActiveField { ...fieldProps } />
  }
}
