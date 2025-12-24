import { OAuth2Client } from "google-auth-library";
import  {GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI, GOOGLE_CLIENT_SECRET} from "../secrets"


export default new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    // GOOGLE_REDIRECT_URI
    "postmessage"
);
