/* @flow */
import * as React from 'react';
import { ActiveFormContext } from './ActiveFormContext';

type ErrorSummaryProps = {
  header: React.Node,
  footer: React.Node,
  options: {},
};

export default class ErrorSummary extends React.Component<ErrorSummaryProps> {
  static defaultProps = {
    header: '',
    footer: '',
    options: { className: 'error-summary' }
  };

  render() {
    return <ActiveFormContext.Consumer>
      {
        ({ formId, model }) => {
          let messages = [];

          Object.keys(model).forEach((attribute, attributeIdx) => {
            const errors = model[attribute].errors || [];
            errors.forEach(
              (message, idx) => messages.push(<li key={`${attribute}-${attributeIdx}-error-${idx}`}>{ message }</li>)
            );
          });

          let content = [];
          if (messages.length) {
            content.push(this.props.header);
            content.push(<ul key={`${formId}-error-summary`} { ... this.props.options } >{ messages }</ul>);
            content.push(this.props.footer);
          }
          return <div>{ content }</div>
        }
      }
    </ActiveFormContext.Consumer>
  }
}