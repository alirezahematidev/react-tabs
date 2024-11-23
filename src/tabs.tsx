import { Children, createContext, createRef, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";

const TabsChildrenContext = createContext<boolean>(false);

type TabIdentifier = string | number;

export interface TabProps {
  id: TabIdentifier;
  label: string | React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface BaseProps {
  layout?: "horizontal" | "vertical";
  direction?: "ltr" | "rtl";
  activeTabId: TabIdentifier;
  onChange: (id: TabIdentifier) => void;
}

interface PropsWithTabs {
  tabs: TabProps[];
}

interface PropsWithChildren {
  children: React.ReactElement<TabProps>[];
}

type TabsProps = Partial<BaseProps> & (PropsWithTabs | PropsWithChildren);

function Tab(props: TabProps): React.ReactNode {
  const isTabsChildren = useContext(TabsChildrenContext);

  console.assert(typeof props === "object");

  if (!isTabsChildren) throw new Error("Tab should render in Tabs component as first child.");

  return null;
}

function isChildren(props: TabsProps): props is Extract<TabsProps, PropsWithChildren> {
  return "children" in props && Array.isArray(props.children);
}

function def(tabId: TabIdentifier | undefined, tabs: TabProps[]) {
  const [tab] = tabs || [];

  return tabId || tab.id;
}

function preparedTabs(props: TabsProps) {
  if (isChildren(props)) {
    const childProps = Children.map(props.children, ({ props }) => props);

    return childProps;
  }

  return props.tabs;
}

type TabObjectClass = { [cls: string]: boolean | undefined };

type TabClass = string | TabObjectClass;

function classes(...inputs: TabClass[]) {
  const classList: string[] = [];

  function handleClassObject(inputObject: TabObjectClass) {
    const list: string[] = [];

    for (const key in inputObject) {
      if (inputObject[key]) list.push(key);
    }

    return list;
  }

  inputs.forEach((input) => {
    if (typeof input === "string") {
      classList.push(input);
    } else {
      classList.push(...handleClassObject(input));
    }
  });

  return [...new Set(classList)].filter(Boolean).join(" ");
}

function useTabState(props: TabsProps, tabs: TabProps[]) {
  const [_activeTabId, _onChange] = useState<TabIdentifier>(def(props.activeTabId, tabs));

  return useMemo(() => {
    const { activeTabId = _activeTabId, onChange = _onChange } = props;

    return { activeTabId, onChange };
  }, [props, _activeTabId]);
}

interface ActiveIndicatorProps {
  activeTabId: TabIdentifier;
  tabs: TabProps[];
  refs: React.MutableRefObject<{
    [k: string]: React.RefObject<HTMLSpanElement>;
  }>;
}

type Styles = {
  width: number;
  height: number;
  bottom: number;
  transform: string;
};

const defaultStyles: Styles = {
  transform: "translateX(0)",
  width: 0,
  bottom: 0,
  height: 0,
};

function ActiveIndicator({ activeTabId, tabs, refs }: ActiveIndicatorProps) {
  const [style, setStyle] = useState<Styles>(defaultStyles);

  useLayoutEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.id === activeTabId);

    if (activeIndex === -1) return;

    const current = refs.current[tabs[activeIndex].id].current;

    if (current) {
      const width = current.clientWidth;
      const height = Math.min(current.clientHeight, 2);
      const bottom = (height / 2) * -1;
      const transform = `translateX(${current.offsetLeft}px)`;

      setStyle({ width, height, bottom, transform });
    }
  }, [refs, tabs, activeTabId]);

  return <div className="tab-item-indicator" style={style} />;
}

function Tabs(props: TabsProps) {
  const tabs = useMemo(() => preparedTabs(props), [props]);

  const refs = useRef(Object.fromEntries(tabs.map(({ id }) => [id, createRef<HTMLSpanElement>()])));

  const { activeTabId, onChange } = useTabState(props, tabs);

  function onTabChange(event: React.MouseEvent, id: TabIdentifier, disabled?: boolean) {
    event.preventDefault();

    if (activeTabId !== id && !disabled) onChange(id);
  }

  const content = useMemo(() => {
    const tab = tabs.find((item) => item.id === activeTabId);

    if (!tab) return null;

    return tab.content;
  }, [tabs, activeTabId]);

  return (
    <TabsChildrenContext.Provider value>
      <div className="tab-container">
        <div className="tab-items">
          {tabs.map((tab) => {
            const { id, label, disabled } = tab;

            return (
              <span
                key={id}
                ref={refs.current[id]}
                className={classes("tab-item", { "active-tab-item": id === activeTabId, "disabled-tab-item": disabled })}
                onMouseDown={(event) => onTabChange(event, id, disabled)}
              >
                {label}
              </span>
            );
          })}
          <ActiveIndicator activeTabId={activeTabId} refs={refs} tabs={tabs} />
        </div>
        <div className="active-tab-content">{content}</div>
      </div>
    </TabsChildrenContext.Provider>
  );
}

Tabs.Tab = Tab;

export { Tabs };
