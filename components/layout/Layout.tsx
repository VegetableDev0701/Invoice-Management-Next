import NavBar from './NavBar/NavBar';
import BorderBars from './TopSideBorder/BorderBars';

const Layout: React.FC<{ children: React.ReactNode }> = (props) => {
  return (
    <>
      <div className="font-sans">
        <BorderBars />
        <NavBar />
        <main>{props.children}</main>
      </div>
    </>
  );
};

export default Layout;
