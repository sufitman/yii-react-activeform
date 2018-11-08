/* @flow */
import * as React from "react";
import type {AttributeData, ListProps, UpdateAttributeCallback} from "./flow-typed/yiiAFLibDef";
import ActiveField from "./ActiveField";

export default class List extends React.Component<ListProps> {
  static defaultProps = {
    inputOptions: {'className': 'form-control'},
    itemOptions: {},
    encode: true,
    multiple: true,
  };

  value: void | any = this.props.multiple ? [] : null;

  getOnChange = (
    updateAttribute?: ?UpdateAttributeCallback,
    attributeData: AttributeData
  ) => (e: SyntheticEvent<*>) => {
    if (this.props.multiple && Array.isArray(this.value)) {
      if (e.currentTarget.checked) {
        this.value = [ ...this.value, e.currentTarget.value ];
      } else {
        this.value.splice(this.value.indexOf(e.currentTarget.value), 1);
      }
    } else {
      if (e.currentTarget.checked) {
        this.value = e.currentTarget.value;
      } else {
        this.value = null;
      }
    }

    updateAttribute && updateAttribute(this.props.attribute, {
      ...attributeData,
      value: this.value
    }, attributeData.options ? attributeData.options.validateOnChange : false);
  };

  getList = (id: string, attributeData: AttributeData, updateAttribute?: ?UpdateAttributeCallback) => {
    const value = attributeData.value;
    const Tag = this.props.tag || 'div';
    const name = this.props.multiple ? this.props.attribute + '[]' : this.props.attribute;
    let lines: Array<React.Node> = [];
    let idx = 0;
    const items = this.props.items || {};

    Object.keys(items).forEach(val => {
      let label = items[val];
      let checked: boolean = value !== undefined && (
        (!Array.isArray(value) && val === value) || (Array.isArray(value) && value.indexOf(val) !== -1)
      );
      if (this.props.formatter && typeof this.props.formatter === 'function') {
        lines.push(this.props.formatter(idx, label, name, checked, val));
      } else {
        let key = `${id}-${idx}`;
        lines.push(<label key={ `${key}-label` }>
          <input
            type={ this.props.type }
            name={ name }
            checked={ checked }
            value={ val }
            id={ key }
            key={ key }
            { ...this.props.itemOptions }
            onChange={ this.getOnChange(updateAttribute, attributeData) }
          />{ label}
        </label>);
      }
      idx++;
    });

    return <Tag id={ id }{ ...this.props.inputOptions }>
      { lines }
    </Tag>;
  };
  render = (): React.Node => <ActiveField { ...this.props } input={ this.getList } />;
}