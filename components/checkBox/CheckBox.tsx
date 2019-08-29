import * as React from 'react';
import * as PropTypes from 'prop-types';
import cx from 'classnames';
import CheckBoxGroup from "./CheckBoxGroup";

interface BaseProps {
  checked?: boolean;
  defaultChecked?: boolean;
  label?: string;
  className?: string;
  value?: string;
  disabled?: boolean;

  onChange?(e: CheckBoxState): void;
}

export type CheckBoxProps = {} & BaseProps & React.HTMLAttributes<HTMLInputElement>;

export interface CheckBoxState {
  checked: boolean;
  defaultChecked: boolean;
}

class CheckBox extends React.PureComponent<CheckBoxProps, CheckBoxState> {
  static propTypes = {
    label: PropTypes.string,
    checked: PropTypes.bool,
    defaultChecked: PropTypes.bool,
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
  };
  static defaultProps = {
    defaultChecked: false,
    value: "",
    disabled: false,
  }
  static Group: typeof CheckBoxGroup;

  constructor(props: CheckBoxProps) {
    super(props);
    this.state = {
      defaultChecked: props.checked || false,
      checked: props.checked || props.defaultChecked || false,
    }
    this.handleChange = this.handleChange.bind(this);
  }

  static getDerivedStateFromProps(nextProps: CheckBoxProps, prevState: CheckBoxState) {
    if ('checked' in nextProps && nextProps.checked !== prevState.checked) {
      return {checked: nextProps.checked};
    }
    return null;
  }

  getPrefixCls(suffix?: string) {
    return `wx-v2-checkbox${suffix ? '-' + suffix : ''}`;
  }

  triggerChange() {
    const {onChange} = this.props;
    if (onChange) {
      onChange({...this.state});
    }
  }

  handleChange(e) {
    e.preventDefault();
    e.stopPropagation();
    const {checked} = e.currentTarget;
    if (!('checked' in this.props)) {
      this.setState({checked}, () => {
        this.triggerChange();
      });
    } else {
      this.triggerChange();
    }
  }

  getExtraProps() {
    const {value, checked, className, defaultChecked, label, ...extraProps} = this.props;
    return extraProps;
  }

  render() {
    const {value, className, label, disabled} = this.props;
    const {checked} = this.state;
    const checkBoxCls = cx(this.getPrefixCls(), checked ? this.getPrefixCls('checked') : '', disabled ? this.getPrefixCls('disabled') : '', className);

    return (
      <label className="wx-v2-checkbox-wrapper">
        <span className={checkBoxCls}>
          <input
            {...this.getExtraProps()}
            type="checkbox"
            className="wx-v2-checkbox-input"
            value={value}
            checked={checked}
            onChange={this.handleChange}
          />
          <span className="wx-v2-checkbox-inner"/>
        </span>
        <span>{label}</span>
      </label>
    );
  }
}

export default CheckBox;