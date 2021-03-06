import * as React from 'react';
import cx from 'classnames';
import { execFunction, isEmpty, isFunction } from '../utils';
import { MapType } from '../_utils/type';

export declare type ValidateResult = {
  error?: boolean;
  message?: React.ReactNode;
  type?: string;
}

const STATUS = {
  ERROR: 'error',
  EMPTY: 'empty',
  SUCCESS: 'success',
  DEFAULT: 'default',
  WARNING: 'warning',
  PRIMARY: 'primary',
  FOCUS: 'focus',
};
const VALIDATE_SCALE = {
  EMPTY: 'empty',
  RULE: 'rule',
};
const ERROR = {
  EMPTY: 'empty',
  RULE: 'rule',
};
const RULE = {
  PATTERN: 'pattern',
  ASYNC_VALIDATE: 'asyncValidate',
  VALIDATE: 'validate',
};

export type Rule = {
  pattern?: RegExp;
  validate?: (value: any, data: object) => Promise<boolean> | boolean;
  message?: string;
}

export interface DecorateOption {
  label?: React.ReactNode;
  force?: boolean;
  initialValue?: any;
  stopValidate?: boolean;
  required?: boolean;
  validating?: boolean;
  rules?: Rule[];
  message?: React.ReactNode;
}

export interface IDecorateData extends DecorateOption {
  name: string;
  status: string;
  isValidated: boolean;
  validate: boolean;
  value: any;
  error?: object | null;
}

class FieldDecorator {
  static FieldDecoratorItem: typeof FieldDecoratorItem;
  public data: { [index: string]: IDecorateData } = {};
  // private errors: object | null = null;
  validateStopWhenError: boolean = false;
  refFields: MapType<FieldDecoratorItem> = {};

  onRefField(name: string, ref: FieldDecoratorItem): void {
    this.refFields[name] = ref;
  }

  decorate(name: string, options: DecorateOption): (comp: any) => React.ReactElement {
    const { label, force = false, initialValue, stopValidate = false, required, validating } = options;
    this.data[name] = {
      // 字段名
      name,
      // 默认状态
      status: STATUS.DEFAULT,
      initialValue,
      // 初始始
      value: initialValue,
      // 提示信息中，也是表单项中label
      label: label || name,
      // 中断验证
      stopValidate,
      // 验证是显示内容
      validating,
      // 是否已验证
      isValidated: false,
      // 验证结果
      validate: false,
      // 强制验证，即使已验证
      force,
    };
    return (comp: React.ReactElement & React.ReactHTMLElement<any>) => {
      return (
        <FieldDecoratorItem
          onRef={this.onRefField.bind(this, name)}
          refDecorator={this}
          label={label}
          required={required}
          name={name}
          options={options}
          comp={comp}
          validating={validating}
        />
      );
    };
  }

  async getFieldsValue() {
    const values: MapType<any> = {};
    const errors: MapType<boolean> = {};
    for (const name of Object.keys(this.data)) {
      const item = this.data[name];
      values[name] = item.value;
      const validate = await this.refFields[name].triggerValidate();
      if (validate === false) {
        errors[name] = true;
        if ((this.validateStopWhenError || item.stopValidate)) {
          break;
        }
      }
    }
    return values;
  }

  async validateFields(callback: (error: object, values: object) => void): Promise<any> {
    const values: MapType<any> = {};
    const errors: MapType<any> = {};
    let err = false;
    for (const name of Object.keys(this.data)) {
      const item = this.data[name];
      const { force, value, validate, error: validateError, isValidated, stopValidate } = item;
      values[name] = value;
      if (force || !isValidated) {
        const res = await this.refFields[name].triggerValidate();
        const { error } = res;
        if (error) {
          errors[name] = res;
          err = true;
        }
      } else if (!validate) {
        err = true;
        errors[name] = validateError;
      }
      if (err && stopValidate) {
        break;
      }
    }
    return execFunction(callback, null, err ? errors : null, values);
  }

  setValue(name: string, value: any): FieldDecorator {
    this.data[name].value = value;
    return this;
  }

  setFieldValue(name: string, value: any): FieldDecorator {
    const { current: fieldRef } = this.refFields[name].fieldRef;
    const e = { target: { value }, currentTarget: { value } };
    fieldRef.onChange(e as React.ChangeEvent<HTMLInputElement>);
    return this;
  }
}

export interface FieldDecoratorItemProps {
  name?: string | any;
  refDecorator: FieldDecorator | any;
  onRef?: (ref: FieldDecoratorItem) => void;
  options: DecorateOption;
  comp: any;//React.ReactElement & React.ReactHTMLElement<any>;
  required: boolean;
  label: React.ReactNode;
  rules: any[];
  validating: boolean | string;
  message: React.ReactNode;
}

export interface FieldDecoratorItemState {
  isValidated?: boolean;
  status?: string;
  message?: React.ReactNode;
  validate?: boolean;
  error?: object | null;
  value?: any;
  isValidating?: boolean;
  focused?: boolean;
}

/**
 * 修饰项
 */
class FieldDecoratorItem extends React.Component<FieldDecoratorItemProps, FieldDecoratorItemState | any> {
  static defaultProps: Partial<FieldDecoratorItemProps> = {
    required: false,
    validating: '正在验证...',
    options: {},
    rules: [],
    message: '',
  };
  fieldProps: any;
  focusValue: string;

  constructor(props: FieldDecoratorItemProps) {
    super(props);
    const { name, refDecorator, onRef, options, comp } = props;
    this.refDecorator = refDecorator;
    this.name = name;
    this.state = {
      ...refDecorator.data[name],
      focused: false,
      isValidating: false,
      isValidated: false,
      error: null,
    };
    if (onRef) {
      onRef(this);
    }
    const { initialValue } = options;
    this.fieldRef = React.createRef();
    const fieldProps = {
      ref: this.fieldRef,
      name,
      value: initialValue,
      onChange: (value: any) => {
        this.setValue(value);
      },
      // onFocus: (e) => {
      //   const { value } = e.currentTarget;
      //   this.focusValue = value;
      //   this.onFocus(e);
      // },
      // onBlur: (e) => {
      //   this.onBlur(e);
      // },
    };
    this.fieldProps = fieldProps;
    this.comp = comp;
    this.fieldComp = React.cloneElement(comp, fieldProps, comp.children);
  }

  fieldRef: React.RefObject<any>;
  name: string;
  refDecorator: FieldDecorator;
  fieldComp: React.ReactElement;
  comp: React.ReactElement;
  onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const { comp: { onFocus } } = this.props;
    this.setState({ focused: true }, () => {
      if (onFocus) {
        onFocus(e);
      }
    });
  };
  onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { value } = e.currentTarget;
    const { comp: { onBlur } } = this.props;
    this.setState({ focused: false }, () => {
      if (this.state.isValidated && value === this.focusValue) {
        return;
      }
      this.triggerValidate(null, () => {
        if (onBlur) {
          onBlur(e);
        }
      }).then();
    });
  };
  setValue = (value: string | object): void => {
    const { name } = this.props;
    this.refDecorator.setValue(name, value);
    this.setState({ value, isValidated: false }, () => {
      this.triggerValidate([VALIDATE_SCALE.EMPTY, VALIDATE_SCALE.RULE], () => {
        this.setState({ isValidated: false });
      }).then(() => {

      });
    });
  };
  // 更新状态
  updateStatus = (nextState: FieldDecoratorItemState, callback?: () => void) => {
    this.setState(nextState, () => {
      this.refDecorator.data[this.name].status = this.state.status;
      this.refDecorator.data[this.name].validate = this.state.validate !== false;
      this.refDecorator.data[this.name].isValidated = this.state.isValidated;
      this.refDecorator.data[this.name].error = this.state.error;
      execFunction(callback);
    });
  };
  // 验证
  validate = (value: any, rules: Rule[]): ValidateResult | Promise<ValidateResult> => {
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const { pattern, validate, message } = rule;
      if (validate && isFunction(validate)) {
        const res = validate(value, this.refDecorator.data);
        if (res instanceof Promise) {
          this.setState({ isValidating: true });
          return res.then(info => {
            this.setState({ isValidating: false });
            return { error: info, message, type: RULE.ASYNC_VALIDATE };
          });
        }
        if (!res) {
          return { error: true, message, type: RULE.VALIDATE };
        }
      } else if (pattern instanceof RegExp) {
        if (!pattern.test(value)) {
          return { error: true, message, type: RULE.PATTERN };
        }
      }
    }
    return { error: false, message: '' };
  };
  // 触发验证
  triggerValidate = async (paramScales?: string | string[] | null, callback?: () => void): Promise<ValidateResult> => {
    const { required, label, options } = this.props;
    const { rules = [], message } = options;
    const { value } = this.state;
    const nextState: FieldDecoratorItemState = { isValidated: true };
    let scales: any = paramScales || [];
    if (scales === null || !scales.length) {
      scales = [VALIDATE_SCALE.EMPTY, VALIDATE_SCALE.RULE];
    }
    // 空验证
    if (isEmpty(value)) {
      if (required && scales.includes(VALIDATE_SCALE.EMPTY)) {
        nextState.status = STATUS.EMPTY;
        nextState.message = message || <div className='wx-v2-form-decorator-message-wrapper'>{label}不能为空</div>;
        nextState.validate = false;
        nextState.error = { error: true, type: ERROR.EMPTY };
        this.updateStatus(nextState, callback);
        return nextState.error;
      }
    } else if (rules && rules.length && scales.includes(VALIDATE_SCALE.RULE)) {
      const res = this.validate(value, rules);
      let info;
      let rule;
      if (res instanceof Promise) {
        this.setState({ isValidating: true });
        info = await res;
        this.setState({ isValidating: false });
        rule = RULE.ASYNC_VALIDATE;
      } else {
        info = res;
        rule = res.type;
      }
      const { error, message } = info;
      if (error) {
        nextState.status = STATUS.ERROR;
        nextState.validate = false;
        nextState.message = message || <div className='wx-v2-form-decorator-message-wrapper'>{label}输入有误</div>;
        nextState.error = { error: true, type: ERROR.RULE, rule };
        this.updateStatus(nextState, callback);
        return nextState.error;
      }
    }
    this.updateStatus({
      status: STATUS.DEFAULT,
      message: null,
      validate: true,
      isValidated: true,
      error: null,
    }, callback);
    return { error: false };
  };

  render(): JSX.Element {
    const { validating } = this.props;
    const { isValidating, focused, status, message, value } = this.state;
    const statusCls = `ws-input-${focused ? 'focus' : status}`;
    const wrapperCls = cx('wx-v2-form-decorator-item', statusCls);
    const messageCls = cx('wx-v2-form-decorator-message', statusCls);
    const validateCls = cx('wx-v2-form-decorator-validate', statusCls);
    return (
      <div className='wx-v2-form-decorator'>
        <div className={wrapperCls}>
          {
            React.cloneElement(this.comp, { ...this.fieldProps, value, status })
          }
        </div>
        {isValidating ? <div className={validateCls}>{validating}</div> : null}
        {status === STATUS.ERROR || STATUS.EMPTY ? <div className={messageCls}>{message}</div> : null}
      </div>
    );
  }
}

FieldDecorator.FieldDecoratorItem = FieldDecoratorItem;
export default FieldDecorator;
