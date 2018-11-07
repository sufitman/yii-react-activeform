/* @flow */
import * as React from 'react';
import Input from "./Input";
import Select from "./Select";
import List from "./List";
import type { InputProps, SelectProps, ListProps } from "./flow-typed/yiiAFLibDef";

const withType =  <T>(props: T, type: string) => ({ ...props, type });
const withoutLabel = <T>(props: T): T => ({ ...props, label: undefined });
const withoutHint = <T>(props: T): T => ({ ...props, hint: undefined });
const withoutError = <T>(props: T): T => ({ ...props, error: undefined });
const multipleList = <T>(props: T, isMultiple: boolean): T => ({ ...props, multiple: isMultiple });

const TextInput = (props: InputProps): React.Node => <Input { ...withType(props, 'text') } />;
const PasswordInput = (props: InputProps): React.Node => <Input { ...withType(props, 'password') } />;
const HiddenInput = (props: InputProps): React.Node => <Input
  { ...withoutLabel(withoutHint(withoutError(withType(props, 'hidden')))) }
/>;
const FileInput = (props: InputProps): React.Node => <React.Fragment>
  <HiddenInput { ...props } inputOptions={ { ...props.inputOptions, id: undefined } }/>
  <Input { ...withType(props, 'file') } />
</React.Fragment>;
const Textarea = (props: InputProps): React.Node => <Input
  { ...props }
  type={ undefined }
  tag={'textarea'}
/>;
const Radio = (props: InputProps): React.Node => <Input
  enclosedByLabel={ true }
  { ...withType(props, 'radio') }
/>;
const Checkbox = (props: InputProps): React.Node => <Input
  enclosedByLabel={ true }
  { ...withType(props, 'checkbox') }
/>;
const DropDownList = (props: SelectProps): React.Node => <Select { ...props } />;
const ListBox = (props: SelectProps): React.Node => <Select { ...multipleList(props, true) } />;
const CheckboxList = (props: ListProps): React.Node => <List { ...withType(props, 'checkbox') } />;
const RadioList = (props: ListProps): React.Node => <List { ...multipleList(withType(props, 'radio'), false) } />;

export {
  withoutLabel,
  TextInput,
  PasswordInput,
  HiddenInput,
  FileInput,
  Textarea,
  Radio,
  Checkbox,
  DropDownList,
  ListBox,
  CheckboxList,
  RadioList,
};
