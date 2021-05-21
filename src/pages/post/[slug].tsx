/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import {
  FiCalendar as CalendarIcon,
  FiUser as UserIcon,
  FiClock as ClockIcon,
} from 'react-icons/fi';

import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const readingTime = useMemo(() => {
    const wordsPerMinute = 200;

    const words = post?.data?.content?.reduce((contentWords, content) => {
      contentWords.push(...content.heading.split(' '));

      const sanitizedContent = RichText.asText(content.body)
        .replace(/[^\w|\s]/g, '')
        .split(' ');

      contentWords.push(...sanitizedContent);

      return contentWords;
    }, []);

    const readTime = Math.ceil(words?.length / wordsPerMinute);

    return `${readTime} min`;
  }, [post]);

  return (
    <>
      <Head>
        <title>{post?.data?.title ?? 'space traveling'}</title>
      </Head>

      <Header />

      <div className={styles.banner}>
        <img
          src={post.data.banner.url}
          alt={post.data.title}
          className={styles.banner}
        />
      </div>

      <article className={commonStyles.container}>
        <header className={styles.heading}>
          <h1>{router.isFallback ? 'Carregando...' : post?.data?.title}</h1>
          <div className={styles.info}>
            <span>
              <UserIcon /> {post?.data?.author}
            </span>
            <time>
              <CalendarIcon />
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>
            <span>
              <ClockIcon /> {readingTime}
            </span>
          </div>
        </header>

        <main className={styles.content}>
          {post.data.content.map(content => (
            <section key={content.heading}>
              <h3>{content.heading}</h3>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </section>
          ))}
        </main>
      </article>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 2,
    }
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: { post },
  };
};
