interface IScroller {
  children: JSX.Element;
}

export const Scroller: React.FC<IScroller> = (props) => {
  return (
    <div className="w-full h-[calc(100vh-200px)] overflow-x-hidden overflow-y-auto">
      {props.children}
    </div>
  );
};
