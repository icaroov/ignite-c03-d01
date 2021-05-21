import { useState } from 'react';
import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { FiCalendar as CalendarIcon, FiUser as UserIcon } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Link from 'next/link';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import Logo from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination.results);
  const [postsNextPage, setPostsNextPage] = useState(postsPagination.next_page);

  const getMorePosts = async (): Promise<void> => {
    const postsResponse = await fetch(postsPagination.next_page).then(
      response => response.json()
    );

    const newPosts = postsResponse.results.map((post: Post) => ({
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }));

    setPosts([...posts, ...newPosts]);
    setPostsNextPage(postsResponse.next_page);
  };

  return (
    <div className={commonStyles.container}>
      <Logo />

      <ul className={styles.post}>
        {posts.map(post => (
          <li key={post.uid}>
            <Link href={`/post/${post.uid}`}>
              <a className={styles.link}>
                <h1>{post.data.title}</h1>
              </a>
            </Link>
            <h4>{post.data.subtitle}</h4>

            <section className={styles.info}>
              <time>
                <CalendarIcon />
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </time>
              <span>
                <UserIcon /> {post.data.author}
              </span>
            </section>
          </li>
        ))}
      </ul>

      {postsNextPage && (
        <button type="button" className={styles.btn} onClick={getMorePosts}>
          Carregar mais posts
        </button>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      orderings: '[document.first_publication_date desc]',
    }
  );

  const results = postsResponse.results.map((post: Post) => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results,
      },
    },
  };
};
