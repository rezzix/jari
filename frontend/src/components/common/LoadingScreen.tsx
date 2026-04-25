import Spinner from './Spinner';

export default function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner className="h-8 w-8 text-primary-600" />
    </div>
  );
}