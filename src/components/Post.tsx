import { Link } from 'react-router-dom';
import classes from './Post.module.css';

interface PostProps {
  id: string; // or number, depending on your data
  author: string;
  body: string;
}

function Post({ id, author, body }: PostProps) {
  return (
    <li className={classes.post}>
      <Link to={id}>
        <p className={classes.author}>{author}</p>
        <p className={classes.text}>{body}</p>
      </Link>
    </li>
  );
}

export default Post;
