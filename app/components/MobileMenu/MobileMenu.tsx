import Image from "next/image";
import Link from "next/link";
import {
  IconToolsKitchen2,
  IconUser,
  IconShoppingBag,
} from "@tabler/icons-react";
import { signOut, getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../store/user";

export default function MobileMenu({ toggleMenu }) {
  const router = useRouter();
  const auth = getAuth();

  const { user } = useUserStore();

  const handleSignout = () => {
    router.push("/");
    signOut(auth).then(() => {
      toggleMenu();
      router.push("/");
      console.log("user is signed out");
    });
  };

  if (!user) return null;
  return (
    <div className="mobile-menu flex flex-col fixed w-screen h-screen bg-black z-10">
      <Image
        className="absolute right-4"
        src="./images/close-icon.svg"
        alt="Fechar Menu"
        width={30}
        height={30}
        onClick={toggleMenu}
      />
      <div className="flex flex-col items-center mt-12">
        <Image
          className=""
          src="./images/menu-profile.svg"
          alt="Foto de perfil"
          width={80}
          height={80}
        />
        <h2 className="mt-4 text-lg font-semibold">{user.name || user.email}</h2>
        <span>Plano: {user.plan.name}</span>
        {user.plan.planId !== 3 && (
          <span>{user.plan.recipeCount} receitas restantes</span>
        )}
      </div>
      <nav className="mt-8">
        <ul className="flex flex-col gap-8">
          <li>
            <Link
              className="flex items-center gap-1 text-black no-underline"
              href="/"
              onClick={toggleMenu}
            >
              <IconToolsKitchen2 size={20} stroke={2} />
              Criar Receitas
            </Link>
          </li>
          <li>
            <Link
              className="flex items-center gap-1 text-black no-underline"
              href="/plans"
              onClick={toggleMenu}
            >
              <IconShoppingBag size={20} stroke={2} />
              Meu Plano
            </Link>
          </li>
          <li>
            <Link
              className="flex items-center gap-1 text-black no-underline"
              href="/profile"
              onClick={toggleMenu}
            >
              <IconUser size={20} stroke={2} />
              Perfil
            </Link>
          </li>
        </ul>
      </nav>
      <button
        className="bg-secondary py-1 px-2 text-white rounded-2xl
                shadow-lg text-center absolute bottom-4 left-4 text-sm"
        onClick={handleSignout}
      >
        Sair
      </button>
    </div>
  );
}
