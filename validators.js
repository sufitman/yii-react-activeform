/* @flow */
import punycode from 'punycode';

const isEmpty = (value: any): boolean => {
  return value === null || value === undefined || (Array.isArray(value) && value.length === 0) || value === '';
};

const prepareMessage = (message: string, value: any): string => {
  return message && message.replace(/{value}/g, value);
};

const validateMimeType = (mimeTypes: Array<string>, fileType: string): boolean => {
  for (let i = 0, len = mimeTypes.length; i < len; i++) {
    if (new RegExp(mimeTypes[i]).test(fileType)) {
      return true;
    }
  }
  return false;
};

type FileValidatorOptions = {
  extensions: Array<string>,
  wrongExtension: string,
  mimeTypes: Array<string>,
  wrongMimeType: string,
  maxSize: number,
  tooBig: string,
  minSize: number,
  tooSmall: string,
};
const validateFile = (file: File, options: FileValidatorOptions): Array<string> => {
  let messages = [];
  if (options.extensions && options.extensions.length > 0) {
    let index = file.name.lastIndexOf('.');
    let ext = !~index ? '' : file.name.substr(index + 1, file.name.length).toLowerCase();

    if (!~options.extensions.indexOf(ext)) {
      messages.push(options.wrongExtension.replace(/{file}/g, file.name));
    }
  }

  if (options.mimeTypes && options.mimeTypes.length > 0) {
    if (!validateMimeType(options.mimeTypes, file.type)) {
      messages.push(options.wrongMimeType.replace(/{file}/g, file.name));
    }
  }

  if (options.maxSize && options.maxSize < file.size) {
    messages.push(options.tooBig.replace(/{file}/g, file.name));
  }

  if (options.minSize && options.minSize > file.size) {
    messages.push(options.tooSmall.replace(/{file}/g, file.name));
  }

  return messages;
};

type ImageValidatorOptions = FileValidatorOptions & {
  notImage: string,
  underWidth: string,
  overWidth: string,
  underHeight: string,
  overHeight: string,
  minWidth: number,
  maxWidth: number,
  minHeight: number,
  maxHeight: number,
};
const validateImageSize = (file: File, image: Image, options: ImageValidatorOptions): Array<string> => {
  let messages = [];
  if (options.minWidth && image.width < options.minWidth) {
    messages.push(options.underWidth.replace(/{file}/g, file.name).replace(/{minWidth}/g, options.minWidth.toString()));
  }

  if (options.maxWidth && image.width > options.maxWidth) {
    messages.push(options.overWidth.replace(/{file}/g, file.name).replace(/{maxWidth}/g, options.maxWidth.toString()));
  }

  if (options.minHeight && image.height < options.minHeight) {
    messages.push(options.underHeight.replace(/{file}/g, file.name).replace(/{minHeight}/g, options.minHeight.toString()));
  }

  if (options.maxHeight && image.height > options.maxHeight) {
    messages.push(options.overHeight.replace(/{file}/g, file.name).replace(/{maxHeight}/g, options.maxHeight.toString()));
  }
  return messages;
};

const validateImage = (
  file: File,
  options: ImageValidatorOptions,
  fileReader: FileReader,
  image: Image
): Promise<*> => {
  return new Promise((resolve, reject) => {
    let messages = [];
    image.onload = async () => {
      const imageSizeErrors = await validateImageSize(file, image, options);
      resolve([ ...messages, ...imageSizeErrors ]);
    };

    image.onerror = () => {
      messages.push(options.notImage.replace(/{file}/g, file.name));
      resolve(messages);
    };

    fileReader.onload = function () {
      image.src = this.result;
    };

    fileReader.onerror = () => {
      reject(new Error('FileReader error'));
    };

    fileReader.readAsDataURL(file);
  });
};

type RequiredValidatorOptions = {
  requiredValue?: any,
  strict: boolean,
  message: string
};
export const required = (value: any, clientOptions: RequiredValidatorOptions): void | string => {
  const options = { ...{
    message: 'The value is required',
    strict: false,
  }, ...clientOptions };
  let valid = false;
  if (options.requiredValue === undefined) {
    let isString = typeof value === 'string' || value instanceof String;
    if ((options.strict && value) || (!options.strict && !isEmpty(isString ? value.trim() : value))) {
      valid = true;
    }
  } else if ((!options.strict && value === options.requiredValue) || (options.strict && value === options.requiredValue)) {
    valid = true;
  }

  if (!valid) {
    return prepareMessage(options.message, value);
  }
};

type BooleanValidatorOptions = {
  skipOnEmpty: boolean,
  strict: boolean,
  trueValue: any,
  falseValue: any,
  message: string
}
export const boolean = (value: any, clientOptions: BooleanValidatorOptions): void | string  => {
  const options = { ...{
    skipOnEmpty: false,
    strict: false,
    trueValue: '1',
    falseValue: '0',
    message: '{value} is not boolean'
  }, ...clientOptions };
  if (options.skipOnEmpty && isEmpty(value)) {
    return;
  }
  let valid = (!options.strict && (value == options.trueValue || value == options.falseValue))
    || (options.strict && (value === options.trueValue || value === options.falseValue));

  if (!valid) {
    return prepareMessage(options.message, value);
  }
};

type StringValidatorOptions = {
  skipOnEmpty: boolean,
  is?: number,
  min: number,
  max: number,
  notEqual: string,
  tooShort: string,
  tooLong: string,
  message: string,
}
export const string = (value: any, clientOptions: StringValidatorOptions): Array<string>  => {
  const options = { ...{
    message: '{value} is not a string',
    notEqual: 'Value length must be {is}',
    tooShort: 'Value length must be more than {min}',
    tooLong: 'Value length must be less than {max}',
  }, ...clientOptions };
  let messages = [];
  if (options.skipOnEmpty && isEmpty(value)) {
    return messages;
  }
  if (typeof value !== 'string') {
    messages.push(prepareMessage(options.message, value));
  }
  if (options.is !== undefined && value.length !== options.is) {
    messages.push(prepareMessage(options.notEqual, value).replace(/{is}/g, options.is.toString()));
  }
  if (options.min !== undefined && value.length < options.min) {
    messages.push(prepareMessage(options.tooShort, value).replace(/{min}/g, options.min.toString()));
  }
  if (options.max !== undefined && value.length > options.max) {
    messages.push(prepareMessage(options.tooLong, value).replace(/{max}/g, options.max.toString()));
  }
  return messages;
};

export const file = (files: FileList, options: FileValidatorOptions): Array<string> => {
  let errors = [];
  Array.from(files).forEach((file) => {
    errors = [ ...errors, ...validateFile(file, options) ];
  });
  return errors;
};

export const image = async (files: Array<File>, clientOptions: ImageValidatorOptions): Promise<Array<string>> => {
  const options = { ...{
    notImage: '"{file}" is not an image"!',
    underWidth: 'Width of "{file}" is less than {minWidth}px',
    overWidth: '"{file}" is wider than {maxWidth}px',
    underHeight: '"{file}" is lower than {minHeight}px',
    overHeight: '"{file}" is higher than {maxHeight}px',
    wrongExtension: '"{file}" has wrong extension',
    wrongMimeType: '"{file}" has wrong MIME-type',
    tooBig: '"{file}" is too big',
    tooSmall: '"{file}" is too small',
  }, ...clientOptions };
  let errors = [];
  const filesArray = Array.from(files || []);
  await Promise.all(filesArray.map(async (file) => {
    const fileErrors = validateFile(file, options);
    const imageErrors = await validateImage(file, options, new FileReader(), new Image());
    errors = [ ...errors, ...fileErrors, ...imageErrors ];
  }));
  return errors;
};

type NumberValidatorOptions = {
  skipOnEmpty: boolean,
  pattern: RegExp,
  message: string,
  tooSmall: string,
  tooBig: string,
  min: number,
  max: number,
};
export const number = (value: any, clientOptions: NumberValidatorOptions): Array<string> => {
  const options = { ...{
      message: '{value} is not a number',
      pattern: /^\s*[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?\s*$/,
      tooBig: 'Value must be less than {max}',
      tooSmall: 'Value must be bigger than {min}',
  }, ...clientOptions }
  let errors = [];
  if (options.skipOnEmpty && isEmpty(value)) {
    return errors;
  }

  if (typeof value === 'string' && !options.pattern.test(value)) {
    return [
      prepareMessage(options.message, value)
    ];
  }

  if (options.min !== undefined && value < options.min) {
    errors.push(prepareMessage(options.tooSmall, value).replace(/{min}/g, options.min.toString()));
  }
  if (options.max !== undefined && value > options.max) {
    errors.push(prepareMessage(options.tooBig, value).replace(/{max}/g, options.max.toString()));
  }
  return errors;
};

type RangeValidatorOptions = {
  skipOnEmpty: boolean,
  allowArray: boolean,
  not?: boolean,
  message: string,
  range: Array<*>,
};
export const range = (value: any, clientOptions: RangeValidatorOptions): void | string  => {
  const options = { ...{
    skipOnEmpty: true,
    allowArray: false,
    not: false,
    message: '{value} is not in range',
  }, ...clientOptions };
  if (options.skipOnEmpty && isEmpty(value)) {
    return;
  }

  if (!options.allowArray && Array.isArray(value)) {
    return prepareMessage(options.message, value);
  }

  let inArray = true;
  const array = Array.isArray(value) ? value : [value];
  array.forEach((v) => {
    if (options.range.indexOf(v) === -1) {
      inArray = false;
    }
  });

  if (options.not === undefined) {
    options.not = false;
  }

  if (options.not === inArray) {
    return prepareMessage(options.message, value);
  }
};

type RegexValidatorOptions = {
  skipOnEmpty: boolean,
  not: boolean,
  pattern: RegExp,
  message: string,
};
export const regularExpression = (value: any, clientOptions: RegexValidatorOptions): void | string  => {
  const options = { ...{
      skipOnEmpty: true,
      not: false,
      message: 'Value invalid',
  }, ...clientOptions };
  if (options.skipOnEmpty && isEmpty(value)) {
    return;
  }

  if ((!options.not && !options.pattern.test(value)) || (options.not && options.pattern.test(value))) {
    return prepareMessage(options.message, value);
  }
};

type EmailValidatorOptions = {
  skipOnEmpty: boolean,
  enableIDN: boolean,
  pattern: RegExp,
  allowName: boolean,
  fullPattern: RegExp,
  message: string,
};
export const email = (value: any, clientOptions: EmailValidatorOptions): void | string  => {
  const options = { ...{
    skipOnEmpty: true,
    enableIDN: false,
    allowName: false,
    pattern: /^[a-zA-Z0-9!#$%&'*+\\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/,
    fullPattern: /^[^@]*<[a-zA-Z0-9!#$%&'*+\\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?>$/,
    message: '"{value}" is not valid email',
  }, ...clientOptions };
  if (options.skipOnEmpty && isEmpty(value)) {
    return;
  }

  let valid = true,
    regexp = /^((?:"?([^"]*)"?\s)?)(?:\s+)?(?:(<?)((.+)@([^>]+))(>?))$/,
    matches = regexp.exec(value);

  if (matches === null) {
    valid = false;
  } else {
    let localPart = matches[5],
      domain = matches[6];

    if (options.enableIDN) {
      localPart = punycode.toASCII(localPart);
      domain = punycode.toASCII(domain);

      value = matches[1] + matches[3] + localPart + '@' + domain + matches[7];
    }

    if (localPart.length > 64) {
      valid = false;
    } else if ((localPart + '@' + domain).length > 254) {
      valid = false;
    } else {
      valid = options.pattern.test(value) || (options.allowName && options.fullPattern.test(value));
    }
  }

  if (!valid) {
    return prepareMessage(options.message, value);
  }
};

type UrlValidatorOptions = {
  skipOnEmpty: boolean,
  enableIDN: boolean,
  defaultScheme: string,
  pattern: RegExp,
  message: string,
};
export const url = (value: any, clientOptions: UrlValidatorOptions): void | string  => {
  const options = { ...{
    skipOnEmpty: true,
    enableIDN: true,
    message: 'Value is not valid URL',
  }, ...clientOptions };
  options.pattern = options.pattern || new RegExp(`^${ options.defaultScheme || '(http|https)' }:\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)(?::\\d{1,5})?(?:$|[?\/#])`, 'i');

  if (options.skipOnEmpty && isEmpty(value)) {
    return;
  }

  if (options.defaultScheme && !/:\/\//.test(value)) {
    value = options.defaultScheme + '://' + value;
  }

  let valid = true;

  if (options.enableIDN) {
    const matches = /^([^:]+):\/\/([^/]+)(.*)$/.exec(value);
    if (matches === null) {
      valid = false;
    } else {
      value = matches[1] + '://' + punycode.toASCII(matches[2]) + matches[3];
    }
  }

  if (!valid || !options.pattern.test(value)) {
    return prepareMessage(options.message, value);
  }
};

type CaptchaValidatorOptions = {
  skipOnEmpty: boolean,
  caseSensitive: boolean,
  hash: string,
  message: string,
};
export const captcha = (value: any, clientOptions: CaptchaValidatorOptions): void | string  => {
  const options = { ...{
    skipOnEmpty: false,
    caseSensitive: false,
    message: '{value} does not match',
  }, ...clientOptions };
  if (options.skipOnEmpty && isEmpty(value)) {
    return;
  }

  const v = options.caseSensitive ? value : value.toLowerCase();
  let h = 0;
  for (let i = v.length - 1; i >= 0; --i) {
    h += v.charCodeAt(i);
  }

  if (h !== options.hash) {
    return prepareMessage(options.message, value);
  }
};

type CompareValidatorOptions = {
  skipOnEmpty: boolean,
  compareValue: any,
  type: string,
  operator: string,
  message: string,
};
export const compare = (value: any, clientOptions: CompareValidatorOptions): void | string  => {
  const options = { ...{
      skipOnEmpty: true,
      message: 'Comparison failed',
  }, ...clientOptions };
  if (options.skipOnEmpty && isEmpty(value)) {
    return;
  }

  let compareValue = options.compareValue;
  let valid = true;

  if (options.type === 'number') {
    value = parseFloat(value);
    compareValue = parseFloat(compareValue);
  }
  switch (options.operator) {
    case '==':
      valid = value == compareValue;
      break;
    case '===':
      valid = value === compareValue;
      break;
    case '!=':
      valid = value != compareValue;
      break;
    case '!==':
      valid = value !== compareValue;
      break;
    case '>':
      valid = value > compareValue;
      break;
    case '>=':
      valid = value >= compareValue;
      break;
    case '<':
      valid = value < compareValue;
      break;
    case '<=':
      valid = value <= compareValue;
      break;
    default:
      valid = false;
      break;
  }

  if (!valid) {
    return prepareMessage(options.message, value);
  }
};

type IpValidatorOptions = {
  skipOnEmpty: boolean,
  ipParsePattern: RegExp,
  ipv6Pattern: RegExp,
  ipv4Pattern: RegExp,
  ipv6: boolean,
  ipv4: boolean,
  subnet: boolean,
  negation: boolean,
  noSubnet: string,
  hasSubnet: string,
  message: string,
  ipv6NotAllowed: string,
  ipv4NotAllowed: string,
};
export const ip = (value: any, clientOptions: IpValidatorOptions) => {
  const options = { ...{
    skipOnEmpty: true,
    ipParsePattern: /^(\!?)(.+?)(\/(\d+))?$/,
    ipv6Pattern: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
    ipv4Pattern: /^(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9]))$/,
    ipv6: true,
    ipv4: true,
    subnet: false,
    negation: false,
    noSubnet: 'Value must be an IP address with specified subnet',
    hasSubnet: 'Value must not be a subnet',
    message: 'Value must be a valid IP address',
    ipv6NotAllowed: 'Value must not be an IPv6 address',
    ipv4NotAllowed: 'Value must not be an IPv4 address',
  }, ...clientOptions };
  let messages = [];
  if (options.skipOnEmpty && isEmpty(value)) {
    return messages;
  }

  let negation = null,
    cidr = null,
    matches = new RegExp(options.ipParsePattern).exec(value);
  if (matches) {
    negation = matches[1] || null;
    value = matches[2];
    cidr = matches[4] || null;
  }

  if (options.subnet === true && cidr === null) {
    return prepareMessage(options.noSubnet, value);
  }
  if (options.subnet === false && cidr !== null) {
    return prepareMessage(options.hasSubnet, value);
  }
  if (options.negation === false && negation !== null) {
    return prepareMessage(options.message, value);
  }

  let ipVersion = value.indexOf(':') === -1 ? 4 : 6;
  if (ipVersion === 6) {
    if (!(new RegExp(options.ipv6Pattern)).test(value)) {
      messages.push(prepareMessage(options.message, value));
    }
    if (!options.ipv6) {
      messages.push(prepareMessage(options.ipv6NotAllowed, value));
    }
  } else {
    if (!(new RegExp(options.ipv4Pattern)).test(value)) {
      messages.push(prepareMessage(options.message, value));
    }
    if (!options.ipv4) {
      messages.push(prepareMessage(options.ipv4NotAllowed, value));
    }
  }
  return messages
};

const Validators = {
  required,
  boolean,
  string,
  file,
  image,
  number,
  range,
  regularExpression,
  email,
  url,
  captcha,
  compare,
  ip,
};

export default Validators;