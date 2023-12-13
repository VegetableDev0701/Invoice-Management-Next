import FullScreenLoader from '@/components/UI/Loaders/FullScreenLoader';
import useInitLoadData from '@/hooks/use-load-company-data';

const InitialLoadWrapper = ({ children }: { children: React.ReactNode }) => {
  const { userLoading } = useInitLoadData();
  return (
    <>
      {userLoading && (
        <div className="flex h-screen items-center justify-center">
          <FullScreenLoader color="var(--stak-dark-green)" size={100} />
        </div>
      )}
      {!userLoading && children}
    </>
  );
};

export default InitialLoadWrapper;
