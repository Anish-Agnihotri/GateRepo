import axios from "axios";
import Layout from "components/Layout";
import { getSession } from "next-auth/react";
import { getRepos, Repo } from "pages/api/github/repos";
import { useEffect, useState } from "react";
import { InfinitySpin } from "react-loader-spinner";
import styles from "styles/pages/Home.module.scss";

export default function Home({ userId }: { userId: string | null }) {
  // Repos
  const [repos, setRepos] = useState<Repo[]>([]);
  const [repoLoading, setRepoLoading] = useState<boolean>(true);

  const getAllRepos = async () => {
    setRepoLoading(true);
    try {
      const { data } = await axios.get("/api/github/repos");
      setRepos(data);
    } catch (e) {
      console.error(e);
    }
    setRepoLoading(false);
  };

  useEffect(() => {
    if (userId) {
      getAllRepos();
    }
  }, [userId]);

  return (
    <Layout>
      <div className={styles.home}>
        <h2>Private Repos</h2>
        <p>Token-gateable repos</p>
        <div className={styles.home__repo}>
          {repoLoading ? (
            <Loading />
          ) : (
            repos.map((repo: Repo, i: number) => {
              return (
                <div className={styles.home__repo_item} key={i}>
                  <a
                    href={repo.htmlURL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {repo.fullName}
                  </a>
                  <button>Gate</button>
                </div>
              );
            })
          )}
        </div>
        <h2>Existing GateRepo Repos</h2>
        <div></div>
      </div>
    </Layout>
  );
}

function Loading() {
  return (
    <div className={styles.home__loading}>
      <InfinitySpin color="grey" width="200" />
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  return {
    props: {
      session,
      userId: session?.user.id ?? null,
    },
  };
}
