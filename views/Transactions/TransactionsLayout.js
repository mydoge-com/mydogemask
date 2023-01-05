import { Layout } from '../../components/Layout';
import { Header } from './components/Header';

export const TransactionsLayout = ({ children, ...props }) => {
  return (
    <Layout p={0} {...props}>
      <Header />
      {children}
    </Layout>
  );
};
