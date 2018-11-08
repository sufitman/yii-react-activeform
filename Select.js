/* @flow */
import * as React from "react";
import type {AttributeData, SelectProps, UpdateAttributeCallback} from "./flow-typed/yiiAFLibDef";
import ActiveField from "./ActiveField";

export default class Select extends React.Component<SelectProps> {
  static defaultProps = {
    inputOptions: {'className': 'form-control'},
    multiple: false,
  };

  getOnChange = (updateAttribute?: ?UpdateAttributeCallback, attributeData: AttributeData) => (e: SyntheticEvent<*>) => {
    if (!this.props.multiple) {
      attributeData.value = e.currentTarget.value;
    } else {
      attributeData.value = Array
        .from(e.currentTarget.options)
        .filter(i => i.selected && i.value)
        .map(i => i.value)
    }
    updateAttribute && updateAttribute(this.props.attribute, attributeData, attributeData.options ? attributeData.options.validateOnChange : false);
  };

  getOnBlur = (updateAttribute?: ?UpdateAttributeCallback, attributeData: AttributeData) => () => {
    updateAttribute && updateAttribute(this.props.attribute, attributeData,  attributeData.options ? attributeData.options.validateOnBlur : false)
  };

  getSelect = (id: string, attributeData: AttributeData, updateAttribute?: ?UpdateAttributeCallback): React.Element<*> => {
    const selectProps = {
      multiple: this.props.multiple,
      value: attributeData.value,
      key: id,
      name: this.props.attribute,
      onChange: this.getOnChange(updateAttribute, attributeData),
      onBlur: this.getOnBlur(updateAttribute, attributeData),
      id,
      ...this.props.inputOptions
    };
    let selectOptions = [];
    if (this.props.prompt) {
      selectOptions.push(<option value={''} key={ `${id}-prompt` }>{ this.props.prompt }</option>)
    }

    Object.keys(this.props.data).forEach((value) => {
      let label = this.props.data[value];
      let option;
      if (typeof label === 'object') {
        let group = [];
        Object.keys(label).forEach((subValue) => {
          group.push(<option value={ subValue } data-bs={ subValue } key={`${id}-${subValue}`}>{ label[subValue] }</option>)
        });
        option = <optgroup label={ value } key={`${id}-${value}-group`}>{ group }</optgroup>
      } else {
        option = <option value={ value } data-bs={ value } key={`${id}-${value}`}>{ label }</option>;
      }
      selectOptions.push(option);
    });
    return <select { ...selectProps } >{ selectOptions }</select>;
  };
  render = (): React.Node => <ActiveField { ...this.props } input={ this.getSelect } />;
}