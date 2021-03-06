import * as React from 'react';
import cx from 'classnames';
import FieldDecorator from './FomDecorator';
import FormItem from './FormItem';

export declare type FormWidgetProps = {
  className?: string;
  style?: React.CSSProperties;
  form?: IFromPropsRef;
}

export declare type FormWidgetState = any

export interface IFromPropsRef {
  fieldDecorator: FieldDecorator;
  getFieldsValue: () => object;
  validateFields: (callback: (error: object, values: any) => void) => any;
}

export interface FormProps {
  className?: string;
  style?: React.CSSProperties;
  form?: IFromPropsRef | null;
}

export declare type FormState = any


export default class Form extends React.Component<FormProps, FormState> {
  static Item: typeof FormItem;
  static Decorator: typeof FieldDecorator;
  static create = function <T = {}>(WrappedForm: React.ComponentClass<React.ComponentProps<any> & { form: IFromPropsRef }>) {
    const fieldDecorator = new FieldDecorator();
    const form: IFromPropsRef = {
      fieldDecorator,
      getFieldsValue() {
        return fieldDecorator.getFieldsValue();
      },
      validateFields(callback) {
        return fieldDecorator.validateFields(callback);
      },
    };
    return class FormWidget extends React.Component<FormWidgetProps & T, FormWidgetState> {
      render() {
        const { className, ...extraProps } = this.props;
        const clsName = cx('wx-v2-form', className);
        return (
          <WrappedForm className={clsName} {...extraProps} form={form} />
        );
      }
    };
  };

  render() {
    const { style, className, children, form, ...extraProps } = this.props;
    const clsName = cx('wx-v2-form', className);
    return (
      <div className={clsName} style={style} {...extraProps}>
        {children}
      </div>
    );
  }
}
