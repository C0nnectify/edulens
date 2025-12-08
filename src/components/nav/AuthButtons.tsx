
import { Button } from "@/components/ui/button";

type Props = {
  onSignin: () => void;
  onSignup: () => void;
};

const AuthButtons = ({ onSignin, onSignup }: Props) => (
  <>
    <Button size="sm" onClick={onSignup} className="bg-emerald-600 hover:bg-emerald-700 text-white">
      Sign Up
    </Button>
  </>
);

export default AuthButtons;
