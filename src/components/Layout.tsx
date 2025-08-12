import { Outlet } from 'react-router-dom';
import Header from './Header';
import { MadeWithDyad } from './made-with-dyad';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container py-8">
        <Outlet />
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Layout;