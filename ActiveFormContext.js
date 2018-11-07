/* @flow */
import React from "react";

export const ActiveFormContext = React.createContext({
  enableClientValidation: true,
  enableAjaxValidation: false,
  validateOnSubmit: true,
  validateOnChange: true,
  validateOnBlur: true,
  validateOnType: false,
  validationDelay: 500,
  errorCssClass: 'has-error',
  successCssClass: 'has-success',
  formId: '',
  model: {},
});