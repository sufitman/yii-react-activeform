/* @flow */
import * as React from 'react';
import { ActiveFormContext } from './ActiveFormContext';
import type {
  ActiveFormContextProps,
  ActiveFieldProps,
  LabelOptions,
  AttributeData,
  TemplatePartLabel,
  TemplateParts,
} from "./flow-typed/yiiAFLibDef";

export default class ActiveField extends React.Component<ActiveFieldProps> {
  static defaultProps = {
    options: {'className': 'form-group'},
    errorOptions: {'className': 'help-block'},
    labelOptions: {'className': 'control-label'},
    hintOptions: {'className': 'hint-block'},
  };

  activeFormData: ActiveFormContextProps;
  attributeData: AttributeData;
  templateParts: Array<TemplatePartLabel> = ['label', 'input', 'hint', 'error'];
  mounted: boolean = false;
  fieldRef = React.createRef();

  getId = (): string => this.props.id || `${this.activeFormData.formId}-${this.props.attribute}`;

  buildLabel = (): ?React.Element<any> => {
    const label = this.props.label || (this.attributeData && this.attributeData.label);
    if (!label) {
      return null
    }
    let options: LabelOptions = { ...this.props.labelOptions, htmlFor: this.getId() };
    return <label { ...options } key={ `${this.getId()}-label` }>{ label }</label>;
  };

  buildTemplatePart = (part: string, templatePartText: ?string): ?React.Element<any> => {
    if (!templatePartText) {
      return null;
    }
    let options = { ...this.props[`${part}Options`]};
    let Tag = options.tag || 'div';
    delete options.tag;
    return <Tag { ...options } key={ `${this.getId()}-${part}` }>{ templatePartText }</Tag>;
  };

  getTemplatePart = (part: TemplatePartLabel): ?React.Element<any> => {
    const errors = this.attributeData.errors || [];
    switch (part) {
      case 'label': return this.buildLabel();
      case 'input': return this.props.input(this.getId(), this.attributeData, this.activeFormData.updateAttribute);
      case 'error': return this.buildTemplatePart('error', errors[0]);
      case 'hint': return this.buildTemplatePart('hint', this.props.hint || this.attributeData.hint);
      default: return null;
    }
  };

  componentDidMount = () => {
    this.mounted = true
  };

  render(): React.Node {
    return (
      <ActiveFormContext.Consumer>
        {
          (AFContextProps: ActiveFormContextProps) => {
            this.activeFormData = AFContextProps;

            this.attributeData = AFContextProps.model[this.props.attribute] || {};
            this.attributeData.options = {
              enableClientValidation: this.props.enableClientValidation || AFContextProps.enableClientValidation,
              enableAjaxValidation: this.props.enableAjaxValidation || AFContextProps.enableAjaxValidation,
              validateOnChange: this.props.validateOnChange || AFContextProps.validateOnChange,
              validateOnBlur: this.props.validateOnBlur || AFContextProps.validateOnBlur,
              validateOnType: AFContextProps.validateOnType,
              validationDelay: this.props.validationDelay || AFContextProps.validationDelay,
            };
            let content: TemplateParts = {};
            this.templateParts.forEach((part) => {
              let el = this.getTemplatePart(part);
              if (el) {
                content[part] = el;
              }
            });

            if (
              content.input.props &&
              content.input.props.type === 'file' &&
              AFContextProps.setHasFile
            ) {
              AFContextProps.setHasFile();
            }

            let props: { [attr: string]: any } = { ...this.props.options };

            if (this.mounted) {
              if (!this.attributeData.errors || !this.attributeData.errors.length) {
                props.className =  `${ props.className } ${ AFContextProps.successCssClass }`;
              } else {
                props.className =  `${ props.className } ${ AFContextProps.errorCssClass }`;
              }
            } else {
              if (AFContextProps.addFieldRef) {
                AFContextProps.addFieldRef(this.props.attribute, this.fieldRef);
              }
            }

            return <div { ...props  } ref={ this.fieldRef } >{
              (typeof this.props.template === 'function')
                ? this.props.template(content)
                : <React.Fragment>
                  {content.label}
                  {content.input}
                  {content.hint}
                  {content.error}
                </React.Fragment>
            }</div>;
          }
        }
      </ActiveFormContext.Consumer>
    )
  }
}
