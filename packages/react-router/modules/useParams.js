import useRouter from "./useRouter";

function useParams() {
  const { match } = useRouter();
  return match.params;
}

export default useParams;
