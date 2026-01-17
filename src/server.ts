import App from './app';
import {PORT} from "./secrets"

const port = parseInt(PORT || '3000', 10);
const app = new App();

app.start(port);
