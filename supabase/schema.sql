
-- 1. Profiles Table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('ADMIN', 'CUSTOMER')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  category TEXT,
  active BOOLEAN DEFAULT TRUE,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Orders Table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','CONFIRMED','PREPARING','DELIVERED','CANCELLED')),
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Order Items Table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL
);

-- Cria um registro em "profiles" automaticamente quando um usuário faz signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'CUSTOMER')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- --> PROFILES
-- Usuários podem ler o próprio perfil
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Backend (service_role) pode gerenciar todos os perfis
CREATE POLICY "Service role full access profiles" 
  ON public.profiles FOR ALL USING (auth.role() = 'service_role');


-- --> PRODUCTS
-- Todos podem ver produtos ativos
CREATE POLICY "Anyone can view active products" 
  ON public.products FOR SELECT USING (active = true);

-- Apenas admins ou service_role podem inserir/editar/deletar
CREATE POLICY "Service role full access products" 
  ON public.products FOR ALL USING (auth.role() = 'service_role');


-- --> ORDERS
-- Usuários vêem apenas seus próprios pedidos
CREATE POLICY "Users can view own orders" 
  ON public.orders FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem criar próprios pedidos
CREATE POLICY "Users can insert own orders" 
  ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Backend (service_role) acessa tudo (ex: atualização de status por admin)
CREATE POLICY "Service role full access orders" 
  ON public.orders FOR ALL USING (auth.role() = 'service_role');


-- --> ORDER ITEMS
-- Segue permissão da tabela Orders
CREATE POLICY "Users can view own order items" 
  ON public.order_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order items" 
  ON public.order_items FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access order items" 
  ON public.order_items FOR ALL USING (auth.role() = 'service_role');


-- ==============================================================================
-- Dados Iniciais (Seed)
-- ==============================================================================

INSERT INTO public.products (name, description, price, image_url, category, stock) VALUES
('Camiseta Essencial LuvitCorp', 'Conforto e minimalismo em algodão premium.', 89.90, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 'Vestuário', 100),
('Sneakers Urban', 'Design minimalista e fluido para o seu dia a dia.', 299.90, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 'Calçados', 50),
('Backpack Minimal', 'Design clean com compartimentos utilitários.', 189.90, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 'Acessórios', 30),
('Relógio Classic', 'Mostrador escuro e pulseira de couro moderna.', 359.90, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', 'Acessórios', 15),
('Windbreaker Preto', 'Proteção e elegância com tecido matte impermeável.', 249.90, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', 'Vestuário', 25),
('Garrafa Térmica Inox', 'Mantém a temperatura por até 12 horas. Acabamento fosco.', 119.90, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400', 'Acessórios', 80);
