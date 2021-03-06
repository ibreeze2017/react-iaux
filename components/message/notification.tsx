import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import Notice from './Notice';
import HOCNoticeWrapper from './wrapper';
import { IHOCToastDataItem } from './HOCMessage';

interface BaseProps {
  getView: (notice: IHOCToastDataItem) => React.ReactNode;
}

export type NotificationProps = {} & BaseProps;

export interface NotificationState {
  notices: IHOCToastDataItem[];
}

class Notification extends React.Component<NotificationProps, NotificationState> {
  static growId = 0;
  readonly transitionTime: number;

  constructor(props: NotificationProps) {
    super(props);
    this.transitionTime = 300;
    this.state = { notices: [] };
    this.removeNotice = this.removeNotice.bind(this);
  }

  getUniqueId() {
    const { notices } = this.state;
    return `notice-${new Date().getTime()}-${++Notification.growId}-${notices.length}`;
  }

  addNotice(notice: any) {
    const { notices } = this.state;
    notice.uniqueId = this.getUniqueId();
    if (notices.every((item: any) => item.uniqueId !== notice.uniqueId)) {
      if (notice.length > 0 && notices[notice.length - 1].type === 'loading') {
        notices.push(notice);
        setTimeout(() => {
          this.setState({ notices });
        }, this.transitionTime);
      } else {
        notices.push(notice);
        this.setState({ notices });
      }
      if (notice.duration > 0) {
        setTimeout(() => {
          this.removeNotice(notice.uniqueId);
        }, notice.duration);
      }
    }
    return () => {
      this.removeNotice(notice.uniqueId);
    };
  }

  getView = (notice: IHOCToastDataItem) => {
    const { getView } = this.props;
    if (getView) {
      return getView(notice);
    }
    const HocNotice = HOCNoticeWrapper(Notice, notice);
    return (
      <HocNotice />
    );
  };

  removeNotice(uniqueId: string) {
    const { notices } = this.state;
    this.setState({
      notices: notices.filter((notice: IHOCToastDataItem) => {
        if (notice.uniqueId === uniqueId) {
          if (notice.onClose) setTimeout(notice.onClose, this.transitionTime);
          return false;
        }
        return true;
      }),
    });
  }

  render() {
    const { notices } = this.state;
    return (
      <TransitionGroup className="toast-notification">
        {
          notices.map(notice => (
            <CSSTransition
              key={notice.uniqueId}
              classNames="toast-notice-wrapper notice"
              timeout={this.transitionTime}
            >
              {this.getView(notice)}
            </CSSTransition>
          ))
        }
      </TransitionGroup>
    );
  }
}

function createNotification(props?: any) {
  if (typeof  document === 'undefined') {
    return null;
  }
  const div = document.createElement('div');
  document.body.appendChild(div);
  const ref = React.createRef();
  ReactDOM.render(<Notification ref={ref} {...props} />, div);
  return {
    addNotice(notice: IHOCToastDataItem) {
      return (ref.current as Notification).addNotice(notice);
    },
    destroy() {
      ReactDOM.unmountComponentAtNode(div);
      document.body.removeChild(div);
    },
  };
}

export { createNotification };
export default createNotification();
