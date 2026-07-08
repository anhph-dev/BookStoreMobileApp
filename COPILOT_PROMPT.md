# BookStore Mobile App — Full Copilot Prompt
> React Native (Expo) + Node.js/Express + SQL Server + Firebase + Stripe  
> UI: Minimalist/Clean — Trắng, accent Cam (#FF6B35) + Vàng (#FFB347)  
> Font: Inter/Nunito (Expo Google Fonts) + Ionicons

---

## DESIGN SYSTEM (áp dụng toàn bộ app)

```js
// src/constants/theme.js
export const COLORS = {
  primary:       '#FF6B35',   // cam chính
  primaryLight:  '#FFF0EB',   // nền cam nhạt
  secondary:     '#FFB347',   // vàng accent
  dark:          '#1A1A2E',   // chữ chính
  gray:          '#6B7280',   // chữ phụ
  grayLight:     '#F3F4F6',   // nền card, input
  border:        '#E5E7EB',   // viền
  white:         '#FFFFFF',
  success:       '#10B981',
  warning:       '#F59E0B',
  error:         '#EF4444',
  info:          '#3B82F6',
};

export const FONTS = {
  regular:    'Inter_400Regular',
  medium:     'Inter_500Medium',
  semiBold:   'Inter_600SemiBold',
  bold:       'Inter_700Bold',
  displayBold:'Nunito_700Bold',     // tiêu đề lớn, tên app
  displayExtraBold: 'Nunito_800ExtraBold',
};

export const SIZES = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
  radius:       12,
  radiusLg:     20,
  radiusFull:   999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
  },
};
```

---

## DATABASE SCHEMA (SQL Server — BookStoreDb)

> Schema gốc từ web app, giữ nguyên. Mobile đọc/ghi qua Node.js API.

```
Users:        UserId, FullName, Email, PasswordHash, Role, PhoneNumber,
              Address, IsLocked, CityId, WardId, CreatedDate
Products:     ProductId, ProductName, ISBN, Author, Publisher, Price,
              OriginalPrice, DiscountPercent, Stock, SoldCount, CategoryId,
              ImageUrl, AverageRating, ReviewCount, IsFeatured, IsNewArrival,
              IsBestSeller, IsAvailable, IsDiscontinued, ShortDescription, Description
Categories:   CategoryId, CategoryName, Description
Orders:       OrderId, UserId, OrderDate, TotalAmount, Status, RecipientName,
              PhoneNumber, Email, ShippingAddress, Notes, PaymentMethod,
              PaymentStatus, PaidAt, CityId, WardId, Channel, AppUserId
OrderDetails: OrderDetailId, OrderId, ProductId, Quantity, UnitPrice
Cities:       CityId, CityName, IsActive
Wards:        WardId, CityId, WardName, IsActive

Roles: Admin | Customer | Sale | NVKho
Order Status: Pending | Shipped | Completed | Cancelled
Channel: Mobile (set by this app) | Online (web app)
```

---

## FOLDER STRUCTURE

```
bookstore-mobile/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── firebase.js
│   │   ├── middlewares/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── product.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── user.routes.js
│   │   │   └── payment.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── product.controller.js
│   │   │   ├── order.controller.js
│   │   │   ├── user.controller.js
│   │   │   └── payment.controller.js
│   │   └── app.js
│   ├── .env
│   └── package.json
│
└── mobile/
    ├── src/
    │   ├── constants/
    │   │   └── theme.js
    │   ├── config/
    │   │   ├── api.js
    │   │   └── firebase.js
    │   ├── store/
    │   │   ├── index.js
    │   │   └── slices/
    │   │       ├── authSlice.js
    │   │       ├── cartSlice.js
    │   │       └── productSlice.js
    │   ├── services/
    │   │   ├── authService.js
    │   │   ├── productService.js
    │   │   ├── orderService.js
    │   │   ├── userService.js
    │   │   ├── paymentService.js
    │   │   ├── firestoreCartService.js
    │   │   └── guestCartService.js
    │   ├── navigation/
    │   │   └── AppNavigator.js
    │   ├── screens/
    │   │   ├── auth/
    │   │   │   ├── LoginScreen.js
    │   │   │   └── RegisterScreen.js
    │   │   ├── home/
    │   │   │   ├── HomeScreen.js
    │   │   │   └── SearchScreen.js
    │   │   ├── product/
    │   │   │   └── ProductDetailScreen.js
    │   │   ├── cart/
    │   │   │   └── CartScreen.js
    │   │   ├── checkout/
    │   │   │   ├── CheckoutScreen.js
    │   │   │   └── OrderSuccessScreen.js
    │   │   ├── order/
    │   │   │   ├── OrderHistoryScreen.js
    │   │   │   └── OrderDetailScreen.js
    │   │   ├── profile/
    │   │   │   └── ProfileScreen.js
    │   │   └── admin/
    │   │       ├── ProductManageScreen.js
    │   │       └── ProductFormScreen.js
    │   └── components/
    │       ├── common/
    │       │   ├── AppButton.js
    │       │   ├── AppInput.js
    │       │   ├── AppBadge.js
    │       │   ├── LoadingOverlay.js
    │       │   └── EmptyState.js
    │       ├── product/
    │       │   ├── ProductCard.js
    │       │   ├── ProductCardHorizontal.js
    │       │   ├── FilterBar.js
    │       │   └── RatingStars.js
    │       ├── cart/
    │       │   └── CartItem.js
    │       └── order/
    │           └── OrderStatusBadge.js
    ├── App.js
    └── package.json
```

---

## TASK 1 — Project Setup & Redux & Navigation

```
Task: Initialize BookStore Mobile project.

=== PACKAGES ===
npx create-expo-app mobile --template blank
cd mobile && npx expo install:
  @reduxjs/toolkit react-redux redux-persist
  @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
  react-native-screens react-native-safe-area-context
  @react-native-async-storage/async-storage
  axios
  @tanstack/react-query
  firebase
  @expo-google-fonts/inter @expo-google-fonts/nunito
  @expo/vector-icons
  expo-image-picker
  react-native-toast-message
  react-hook-form

=== src/store/index.js ===
- configureStore combining: auth, cart, product slices
- redux-persist: persistReducer for auth + cart using AsyncStorage
- Export: store, persistor, RootState, AppDispatch

=== src/store/slices/authSlice.js ===
State: {
  user: null,           // { userId, fullName, email, role, phoneNumber }
  token: null,
  isLoggedIn: false,
}
Actions:
  setCredentials({ user, token })   → set all, isLoggedIn = true
  updateUser(userData)              → merge update user fields
  logout()                          → reset to initial state

=== src/store/slices/cartSlice.js ===
State: {
  items: [],            // [{ productId, productName, imageUrl, price, quantity }]
  totalAmount: 0,
  totalCount: 0,
  isGuestCart: true,    // true nếu chưa login
}
Actions:
  addItem(item)                     → if exists: quantity++, else push
  removeItem(productId)             → filter out
  updateQuantity({ productId, quantity })
  clearCart()                       → reset items, amounts
  setGuestCart(false)               → gọi khi login xong
  loadCart(items)                   → dùng khi merge guest + Firestore cart
Recalculate totalAmount + totalCount on every mutation.

=== src/store/slices/productSlice.js ===
State: {
  filterParams: {
    search: '',
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    isFeatured: null,
    isNewArrival: null,
    isBestSeller: null,
    page: 1,
  }
}
Actions: setFilter(params), resetFilter()

=== src/config/api.js ===
- Axios instance, baseURL = process.env.EXPO_PUBLIC_API_URL
- Request interceptor: attach Authorization: Bearer {token} from Redux store
- Response interceptor: if 401 → dispatch logout()

=== src/config/firebase.js ===
- initializeApp with env vars
- Export: storage (getStorage), db (getFirestore)

=== src/navigation/AppNavigator.js ===
Structure:
  NavigationContainer
  └── RootStack (Stack.Navigator, headerShown: false)
      ├── AuthStack (if !isLoggedIn — but only for protected screens)
      │   ├── LoginScreen    (params: returnTo?)
      │   └── RegisterScreen (params: returnTo?)
      └── MainTabs (BottomTab.Navigator)
          ├── HomeStack   → HomeScreen → SearchScreen → ProductDetailScreen
          ├── SearchTab   → SearchScreen → ProductDetailScreen
          ├── CartTab     → CartScreen  (badge: totalCount from Redux)
          ├── OrderTab    → protected: if !isLoggedIn → show LoginPrompt
          └── ProfileTab  → protected: if !isLoggedIn → show LoginPrompt

Protected Tab behavior:
  - Tabs "Đơn hàng" và "Tài khoản": if guest → navigate to LoginScreen
  - Tabs "Trang chủ", "Tìm kiếm", "Giỏ hàng": always accessible

BottomTab styling (theme):
  - activeTintColor: COLORS.primary (#FF6B35)
  - inactiveTintColor: COLORS.gray
  - tabBarStyle: white background, top border COLORS.border, height 60
  - Icons: Ionicons — home-outline/home, search-outline/search,
           cart-outline/cart, receipt-outline/receipt, person-outline/person
  - Cart tab: custom tabBarIcon with badge overlay (red circle, white number)

=== App.js ===
- Wrap with: Provider (Redux), PersistGate, QueryClientProvider, ToastProvider
- Load fonts: useFonts({ Inter_400Regular, Inter_500Medium,
              Inter_600SemiBold, Inter_700Bold,
              Nunito_700Bold, Nunito_800ExtraBold })
- Show SplashScreen until fonts loaded
- Render AppNavigator
```

---

## TASK 1.5 — Guest Flow & Cart Merge

```
Task: Implement guest browsing with cart merge on login.

=== src/services/guestCartService.js ===
AsyncStorage key: 'bookstore_guest_cart'
Functions:
  getGuestCart()           → parse and return items array
  saveGuestCart(items)     → stringify and save
  clearGuestCart()         → remove key

=== src/services/firestoreCartService.js ===
Firestore collection: 'carts', doc ID = userId
Functions:
  loadCart(userId)         → get doc, return items array
  saveCart(userId, items)  → setDoc with merge: true
  clearCart(userId)        → setDoc items: [], updatedAt: now

=== Cart merge logic (call after login in LoginScreen + RegisterScreen) ===
async function mergeCartOnLogin(userId, dispatch) {
  1. guestItems = await guestCartService.getGuestCart()
  2. firestoreItems = await firestoreCartService.loadCart(userId)
  3. merged = mergeItems(guestItems, firestoreItems):
       - For each item: if same productId → keep MAX quantity
       - Combine all unique productIds
  4. dispatch(loadCart(merged))
  5. dispatch(setGuestCart(false))
  6. await firestoreCartService.saveCart(userId, merged)
  7. await guestCartService.clearGuestCart()
}

=== addItem behavior update ===
In cartSlice or via thunk:
  - dispatch addItem always (Redux — instant UI)
  - if isGuestCart: guestCartService.saveGuestCart(updatedItems)
  - if !isGuestCart: firestoreCartService.saveCart(userId, updatedItems)

=== Checkout gate ===
In CartScreen.js, on press "Tiến hành đặt hàng":
  if (!isLoggedIn):
    show Modal with:
      - Title: "Đăng nhập để tiếp tục"
      - Body: "Giỏ hàng của bạn sẽ được giữ nguyên sau khi đăng nhập."
      - Button "Đăng nhập"  → navigate('Login', { returnTo: 'Checkout' })
      - Button "Đăng ký"    → navigate('Register', { returnTo: 'Checkout' })
      - TextButton "Để sau" → close modal
    Modal style: bottom sheet feel, rounded top corners, white bg

=== LoginScreen + RegisterScreen update ===
  - Accept route.params.returnTo
  - After successful auth + mergeCartOnLogin:
      if returnTo → navigation.navigate(returnTo)
      else → navigation.navigate('Home')
```

---

## TASK 2 — Backend: Setup & Auth API

```
Task: Build Node.js/Express backend with SQL Server + Auth.

=== Setup ===
mkdir backend && cd backend && npm init -y
npm install express mssql bcrypt jsonwebtoken dotenv cors multer
npm install firebase-admin stripe
npm install -D nodemon

=== .env ===
PORT=3000
DB_SERVER=localhost
DB_DATABASE=BookStoreDb
DB_USER=sa
DB_PASSWORD=your_password
DB_PORT=1433
JWT_SECRET=bookstore_jwt_secret_2024
JWT_EXPIRES_IN=7d
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

=== src/config/db.js ===
- mssql connection pool using .env
- getPool(): return singleton pool
- Export: getPool, sql (mssql)

=== src/config/firebase.js ===
- admin.initializeApp with credential + storageBucket
- Export: admin, bucket (admin.storage().bucket())

=== src/middlewares/auth.js ===
verifyToken(req, res, next):
  - Extract Bearer token from Authorization header
  - jwt.verify with JWT_SECRET → attach req.user = { userId, email, role }
  - 401 if missing or invalid

requireRole(...roles):
  - Middleware factory: check req.user.role in roles array
  - 403 if not allowed

=== POST /api/auth/register ===
Body: { fullName, email, password, phoneNumber, address?, cityId?, wardId? }
- Check email exists → 409 "Email đã được sử dụng"
- Hash password: bcrypt.hash(password, 11)
- INSERT INTO Users (FullName, Email, PasswordHash, Role, PhoneNumber,
  Address, IsLocked, CityId, WardId, CreatedDate)
  VALUES (@fullName, @email, @hash, 'Customer', @phone, @addr, 0, @cityId, @wardId, GETUTCDATE())
- Return 201: { message: 'Đăng ký thành công', userId }

=== POST /api/auth/login ===
Body: { email, password }
- Find user by email
- If not found → 401 "Email hoặc mật khẩu không đúng"
- If IsLocked = true → 403 "Tài khoản đã bị khóa"
- bcrypt.compare(password, PasswordHash)
- If fail → 401
- jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
- Return 200: {
    token,
    user: { userId, fullName, email, role, phoneNumber, address, cityId, wardId }
  }
```

---

## TASK 3 — Backend: Products & Location API

```
Task: Build Products API with Firebase Storage image upload.

=== GET /api/products ===
Query params: search, categoryId, minPrice, maxPrice,
              isFeatured, isNewArrival, isBestSeller,
              isAvailable (default true), page (default 1), limit (default 10)

Build dynamic WHERE:
  WHERE IsDiscontinued = 0
    AND (@search IS NULL OR ProductName LIKE '%'+@search+'%'
         OR Author LIKE '%'+@search+'%')
    AND (@categoryId IS NULL OR CategoryId = @categoryId)
    AND (@minPrice IS NULL OR Price >= @minPrice)
    AND (@maxPrice IS NULL OR Price <= @maxPrice)
    AND (@isFeatured IS NULL OR IsFeatured = @isFeatured)
    AND (@isNewArrival IS NULL OR IsNewArrival = @isNewArrival)
    AND (@isBestSeller IS NULL OR IsBestSeller = @isBestSeller)
    AND IsAvailable = 1

Pagination: OFFSET (@page-1)*@limit ROWS FETCH NEXT @limit ROWS ONLY
Count query: SELECT COUNT(*) AS total FROM Products WHERE ...

Return: {
  products: [{
    productId, productName, author, price, originalPrice,
    discountPercent, stock, imageUrl, averageRating,
    isFeatured, isNewArrival, isBestSeller, categoryId, categoryName
  }],
  total, page, totalPages
}

=== GET /api/products/:id ===
JOIN Products + Categories
Return full product object including: description, shortDescription,
  publisher, publicationYear, pageCount, isbn, reviewCount, soldCount

=== GET /api/categories ===
SELECT * FROM Categories ORDER BY CategoryName

=== GET /api/cities ===
SELECT * FROM Cities WHERE IsActive = 1 ORDER BY CityName

=== GET /api/cities/:id/wards ===
SELECT * FROM Wards WHERE CityId = @id AND IsActive = 1 ORDER BY WardName

=== POST /api/products (Auth: Admin, NVKho) ===
Use multer (memory storage) for image upload.
Body: multipart/form-data with fields + image file (field name: "image")

Steps:
  1. If image file provided:
     - Generate filename: products/{uuid}.{ext}
     - Upload to Firebase Storage bucket
     - Make public, get download URL → imageUrl
  2. INSERT INTO Products with all fields, imageUrl, CreatedDate = GETUTCDATE()
  3. Return 201: { productId, message: 'Thêm sản phẩm thành công' }

=== PUT /api/products/:id (Auth: Admin, NVKho) ===
  1. If new image: delete old from Firebase Storage, upload new
  2. UPDATE Products SET ... WHERE ProductId = @id
  3. Return 200: { message: 'Cập nhật thành công' }

=== DELETE /api/products/:id (Auth: Admin) ===
Soft delete:
  UPDATE Products SET IsDiscontinued = 1, IsAvailable = 0
  WHERE ProductId = @id
Return 200: { message: 'Đã xóa sản phẩm' }
```

---

## TASK 4 — Backend: Orders & Payment API

```
Task: Build Orders API with stock validation + Stripe payment.

=== POST /api/orders (Auth: Customer) ===
Body: {
  recipientName, phoneNumber, email?,
  shippingAddress, notes?,
  cityId, wardId,
  paymentMethod,   // 'COD' | 'BankTransfer' | 'Stripe'
  items: [{ productId, quantity, unitPrice }]
}

Steps (use SQL transaction):
  BEGIN TRANSACTION
  1. For each item: validate stock
       SELECT Stock FROM Products WHERE ProductId = @id AND IsAvailable = 1
       IF Stock < quantity → ROLLBACK → 400:
         { error: 'Sản phẩm "{productName}" chỉ còn {stock} cuốn trong kho' }
  2. Calculate totalAmount = sum(quantity * unitPrice)
  3. INSERT INTO Orders (UserId, OrderDate, TotalAmount, Status, RecipientName,
       PhoneNumber, Email, ShippingAddress, Notes, PaymentMethod, PaymentStatus,
       CityId, WardId, Channel)
     VALUES (@userId, GETUTCDATE(), @total, 'Pending', ..., 'Pending', ..., 'Mobile')
     → get new OrderId
  4. For each item:
       INSERT INTO OrderDetails (OrderId, ProductId, Quantity, UnitPrice)
       UPDATE Products SET Stock = Stock - @qty, SoldCount = SoldCount + @qty
         WHERE ProductId = @productId
  COMMIT
  Return 201: { orderId, totalAmount, status: 'Pending' }

=== GET /api/orders/my (Auth: Customer) ===
SELECT Orders.*, Cities.CityName, Wards.WardName
FROM Orders
LEFT JOIN Cities ON Orders.CityId = Cities.CityId
LEFT JOIN Wards ON Orders.WardId = Wards.WardId
WHERE Orders.UserId = @userId
ORDER BY OrderDate DESC

=== GET /api/orders/:id (Auth: Customer — own order only) ===
- Fetch order + verify UserId = req.user.userId
- Fetch OrderDetails with ProductName, ImageUrl
- Return full order with items

=== POST /api/payment/create-intent (Auth: Customer) ===
Body: { orderId }
- Fetch order, verify ownership
- amount = totalAmount * 100 (Stripe uses smallest currency unit)
- stripe.paymentIntents.create({ amount, currency: 'vnd', metadata: { orderId } })
- Return: { clientSecret }

=== POST /api/payment/webhook (public — Stripe webhook) ===
- Use express.raw() middleware for this route only
- stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
- On event 'payment_intent.succeeded':
    orderId = event.data.object.metadata.orderId
    UPDATE Orders SET PaymentStatus = 'Paid', PaidAt = GETUTCDATE(),
      Status = 'Pending' WHERE OrderId = @orderId
- Return 200: { received: true }
```

---

## TASK 5 — Backend: Users API

```
Task: Build User profile management API.

=== GET /api/users/me (Auth: any) ===
SELECT u.*, c.CityName, w.WardName
FROM Users u
LEFT JOIN Cities c ON u.CityId = c.CityId
LEFT JOIN Wards w ON u.WardId = w.WardId
WHERE u.UserId = @userId
Return: user object (exclude PasswordHash)

=== PUT /api/users/me (Auth: any) ===
Body: { fullName, phoneNumber, address, cityId, wardId }
UPDATE Users SET ... WHERE UserId = @userId
Return: { message: 'Cập nhật thành công', user: updatedUser }

=== PUT /api/users/me/password (Auth: any) ===
Body: { oldPassword, newPassword }
- Fetch user, bcrypt.compare(oldPassword, PasswordHash)
- If fail → 400 "Mật khẩu cũ không đúng"
- Hash newPassword, UPDATE Users SET PasswordHash = @hash
- Return: { message: 'Đổi mật khẩu thành công' }
```

---

## TASK 6 — Mobile: Common Components (UI Foundation)

```
Task: Build reusable UI components using the Design System.

All components use COLORS, FONTS, SIZES, SHADOWS from src/constants/theme.js
Load fonts via @expo-google-fonts/inter and @expo-google-fonts/nunito.

=== AppButton.js ===
Props: label, onPress, variant ('primary'|'outline'|'ghost'), 
       loading, disabled, icon, fullWidth, size ('sm'|'md'|'lg')

Styles:
  primary: bg COLORS.primary, text white, borderRadius SIZES.radius
  outline: border COLORS.primary, text COLORS.primary, bg transparent
  ghost:   no border, text COLORS.primary
  Loading: ActivityIndicator white inside button
  disabled: opacity 0.5

=== AppInput.js ===
Props: label, placeholder, error, leftIcon, rightIcon,
       secureTextEntry, ...TextInputProps

Style:
  - Label: Inter_500Medium, 14px, COLORS.dark, mb 6
  - Input container: bg COLORS.grayLight, borderRadius SIZES.radius,
    border 1px COLORS.border, height 50, paddingH 14
  - Focus: border COLORS.primary
  - Error: border COLORS.error, show error text below in red
  - Icon: Ionicons 20px COLORS.gray

=== AppBadge.js ===
Props: label, color ('success'|'warning'|'error'|'info'|'default')
Pill shape, small text, colored bg (10% opacity) + colored text

=== LoadingOverlay.js ===
Full screen semi-transparent overlay with ActivityIndicator COLORS.primary

=== EmptyState.js ===
Props: icon (Ionicons name), title, subtitle, actionLabel, onAction
Centered: large icon (COLORS.grayLight), title (Nunito_700Bold 18px),
subtitle (Inter_400Regular 14px COLORS.gray), optional AppButton

=== RatingStars.js ===
Props: rating (0-5), size, showCount, reviewCount
Filled/half/empty stars using Ionicons: star, star-half, star-outline
Color: COLORS.secondary (#FFB347)

=== OrderStatusBadge.js ===
Props: status
Mapping:
  Pending   → AppBadge color 'warning', label 'Chờ xử lý'
  Shipped   → AppBadge color 'info',    label 'Đang giao'
  Completed → AppBadge color 'success', label 'Hoàn thành'
  Cancelled → AppBadge color 'error',   label 'Đã hủy'
  Shipping  → AppBadge color 'info',    label 'Đang vận chuyển'
```

---

## TASK 7 — Mobile: Auth Screens

```
Task: Build Login and Register screens.

=== LoginScreen.js ===
Layout (KeyboardAvoidingView + ScrollView):
  - Top area (30% height): COLORS.primary bg, app logo + "BookStore" (Nunito_800ExtraBold 32px white)
  - White card floating over (borderRadius top 28, negative marginTop):
      Title: "Đăng nhập" (Nunito_700Bold 24px COLORS.dark)
      Subtitle: "Chào mừng trở lại!" (Inter_400Regular 14px COLORS.gray)
      
      Form (react-hook-form):
        AppInput: Email (leftIcon: mail-outline)
        AppInput: Mật khẩu (leftIcon: lock-closed-outline, secureTextEntry,
                  rightIcon: eye toggle)
        
        AppButton primary fullWidth: "Đăng nhập" (loading state)
        
        Divider "hoặc"
        
        TextButton center: "Chưa có tài khoản? Đăng ký ngay"
          → navigate('Register', { returnTo: route.params?.returnTo })

Validation (react-hook-form):
  email: required, email format
  password: required, minLength 6

On submit:
  authService.login → dispatch setCredentials
  → mergeCartOnLogin(userId, dispatch)
  → navigate(returnTo || 'Home')
  Show Toast on error

=== RegisterScreen.js ===
Layout same as Login (header card pattern):
  Title: "Đăng ký"
  Subtitle: "Tạo tài khoản mới"

Form fields (react-hook-form):
  AppInput: Họ và tên (leftIcon: person-outline)
  AppInput: Email (leftIcon: mail-outline)
  AppInput: Mật khẩu (leftIcon: lock-closed-outline, secure, eye toggle)
  AppInput: Xác nhận mật khẩu (validate match)
  AppInput: Số điện thoại (leftIcon: call-outline, keyboardType: phone-pad)
  
  City Picker (Pressable → Modal with FlatList of cities):
    Display: selected city name or "Chọn tỉnh/thành phố"
    Style: same as AppInput
  
  Ward Picker (disabled until city selected):
    Load wards when city changes
    Display: selected ward or "Chọn phường/xã"

  AppButton primary fullWidth: "Đăng ký" (loading)
  TextButton: "Đã có tài khoản? Đăng nhập"

On submit:
  authService.register → authService.login (auto login)
  → dispatch setCredentials → mergeCartOnLogin
  → navigate(returnTo || 'Home')
```

---

## TASK 8 — Mobile: Home & Search Screens

```
Task: Build Home and Search screens with React Query caching.

=== React Query setup (already in App.js) ===
QueryClient: { staleTime: 5*60*1000, cacheTime: 10*60*1000 }

=== src/services/productService.js ===
getProducts(params)     → GET /api/products?...params
getProductById(id)      → GET /api/products/:id
getCategories()         → GET /api/categories

=== HomeScreen.js ===
Layout (ScrollView, white bg):

  ── Header ──
  Row: "BookStore" logo left (Nunito_800ExtraBold 22px COLORS.primary)
       cart icon right (Ionicons cart-outline 24px)
       if isLoggedIn: greeting "Xin chào, {firstName}!" (Inter_400Regular 14px)

  ── Search bar (Pressable → navigate SearchScreen) ──
  Rounded input-like: bg COLORS.grayLight, "Tìm kiếm sách, tác giả..."
  Icon: search-outline COLORS.gray left

  ── Banner Carousel ──
  Horizontal ScrollView (paginated), 3 banners:
    Each: gradient bg (primary to secondary), rounded 16,
          text "Sách mới tháng này", "Giảm đến 30%", v.v.
  Pagination dots below

  ── Category chips ──
  Horizontal FlatList, each chip:
    Pressable pill: category name, bg COLORS.grayLight, text COLORS.gray
    Selected: bg COLORS.primary, text white
    Press → navigate SearchScreen with categoryId filter

  ── Section: Sách Nổi Bật ──
  useQuery(['products','featured'], () => getProducts({ isFeatured: true, limit: 6 }))
  Header row: "Sách Nổi Bật" (Nunito_700Bold 18px) + "Xem tất cả" link
  Horizontal FlatList of ProductCard

  ── Section: Sách Mới ──
  useQuery(['products','newArrival'], () => getProducts({ isNewArrival: true, limit: 6 }))
  Same layout

  ── Section: Bán Chạy ──
  useQuery(['products','bestSeller'], () => getProducts({ isBestSeller: true, limit: 6 }))
  Same layout

Loading: skeleton placeholders (gray animated boxes, same shape as cards)
Error: EmptyState with reload button

=== ProductCard.js ===
Props: product, onPress
Card (white, borderRadius 12, SHADOWS.sm, width ~160):
  - Image: 160x180, borderRadius top, resizeMode cover
    Firebase Storage URL, use Image component with defaultSource
  - If DiscountPercent > 0: badge "−{n}%" top-right (COLORS.error bg, white text)
  - If Stock === 0: gray overlay "Hết hàng"
  - Padding 10:
    - ProductName: Inter_600SemiBold 13px, numberOfLines 2
    - Author: Inter_400Regular 12px COLORS.gray
    - Row: RatingStars (size sm) + reviewCount
    - Price row:
        Price: Inter_700Bold 14px COLORS.primary
        OriginalPrice (if discount): Inter_400Regular 12px line-through COLORS.gray
    - "Thêm vào giỏ" button (small, outline or icon only)

=== SearchScreen.js ===
Layout:
  ── Search header ──
  Row: back button + TextInput (auto focus) + clear button
  Input: bg COLORS.grayLight, borderRadius full, Inter_400Regular

  ── FilterBar.js component ──
  Horizontal ScrollView of filter chips:
    "Danh mục" chip → bottom sheet modal with category list
    "Giá" chip → bottom sheet with price range sliders
    "Bán chạy" toggle chip
    "Sách mới" toggle chip
    "Đang giảm giá" toggle chip
  Active filter: COLORS.primary bg, white text
  Clear all filters button (if any active)

  ── Results ──
  useQuery(['products', filterParams], () => getProducts(filterParams),
    { enabled: true, keepPreviousData: true })
  Debounce search input: 500ms before updating filterParams

  FlatList, numColumns 2, ProductCard items
  Footer: load more button if totalPages > page
  Empty: EmptyState "Không tìm thấy sách phù hợp"
  Loading: skeleton grid
```

---

## TASK 9 — Mobile: Product Detail Screen

```
Task: Build ProductDetail screen.

=== ProductDetailScreen.js ===
Layout (ScrollView):

  ── Image header ──
  Full width image, height 280, bg COLORS.grayLight
  Back button (absolute top-left): circle white bg, Ionicons chevron-back
  Share button (absolute top-right): circle white bg, Ionicons share-outline

  ── Content card (borderRadius top 24, white, marginTop -24) ──

  ── Category + badges row ──
  Category chip (small pill COLORS.primaryLight text COLORS.primary)
  If IsNewArrival: "Mới" badge green
  If IsBestSeller: "Bán chạy" badge orange

  ── Title & Author ──
  ProductName: Nunito_700Bold 22px COLORS.dark
  Author: "Tác giả: {author}" Inter_400Regular 14px COLORS.gray
  Publisher + Year: Inter_400Regular 13px COLORS.gray

  ── Rating row ──
  RatingStars + AverageRating bold + "({reviewCount} đánh giá)"

  ── Price section ──
  If DiscountPercent > 0:
    Row: Price (Nunito_800ExtraBold 26px COLORS.primary)
         OriginalPrice (Inter_400Regular 16px line-through COLORS.gray)
         Badge "Giảm {n}%" (COLORS.error bg, white, pill)
  Else:
    Price only (Nunito_800ExtraBold 26px COLORS.primary)

  ── Stock indicator ──
  If Stock === 0: "Hết hàng" (COLORS.error)
  If Stock < 5:   "Chỉ còn {n} cuốn" (COLORS.warning)
  If Stock >= 5:  "Còn hàng" (COLORS.success)

  ── Quantity selector ──
  Row: "−" button | number | "+" button
  Styled: circle buttons COLORS.grayLight, number Inter_700Bold 16px
  Min: 1, Max: Stock
  Disabled if Stock === 0

  ── Description ──
  "Mô tả sách" section header
  ShortDescription text, expandable "Xem thêm" / "Thu gọn"

  ── Book info table ──
  Rows: ISBN, Số trang, Ngôn ngữ, Năm xuất bản, NXB
  Each row: label COLORS.gray + value COLORS.dark, divider between

── Bottom bar (fixed, white, shadow top) ──
  Row:
    Wishlist icon button (heart-outline Ionicons)
    AppButton primary flex-1: "Thêm vào giỏ hàng"
      → If Stock === 0: disabled gray
      → If guest: dispatch addItem (guestCartService) → show Toast "Đã thêm"
      → If logged in: dispatch addItem → firestoreCartService.saveCart
      → Show animated badge increment on Cart tab

Loading: skeleton layout matching above structure
```

---

## TASK 10 — Mobile: Cart Screen

```
Task: Build Cart screen (guest + auth, Firestore sync).

=== CartScreen.js ===
Layout:

  ── Header ──
  "Giỏ hàng của tôi" (Nunito_700Bold 20px)
  Subtitle: "{n} sản phẩm"

  ── Guest notice banner (if isGuestCart) ──
  Light orange bg, Ionicons information-circle-outline
  Text: "Đăng nhập để lưu giỏ hàng và đặt hàng"
  Button "Đăng nhập" small outline → navigate Login

  ── Items list ──
  FlatList of CartItem components
  Swipe left reveals: Delete action (red)

  ── CartItem.js ──
  Card row (white, margin bottom 12, borderRadius 12, SHADOWS.sm):
    Image: 80x80, borderRadius 8, resizeMode cover
    Content:
      ProductName: Inter_600SemiBold 14px, numberOfLines 2
      Price: Inter_700Bold 15px COLORS.primary
    Quantity control (right):
      "−" | quantity | "+" buttons
      Compact style, border COLORS.border, borderRadius 8
    Subtotal below: Inter_500Medium 13px COLORS.gray
    Delete: Ionicons trash-outline top-right, tap → confirm then removeItem

  ── Order summary card ──
  White card, SHADOWS.sm, borderRadius 12:
    Row: "Tạm tính"     → totalAmount formatted
    Row: "Phí vận chuyển" → "Miễn phí" (COLORS.success) or amount
    Divider
    Row: "Tổng cộng"   → totalAmount (Nunito_700Bold 18px COLORS.primary)

  ── Empty state (if items.length === 0) ──
  EmptyState: icon "cart-outline", title "Giỏ hàng trống",
    subtitle "Thêm sách yêu thích vào giỏ nào!",
    actionLabel "Khám phá sách", onAction → navigate Home

── Bottom bar (fixed) ──
  AppButton primary fullWidth:
    If isGuestCart → "Đăng nhập để đặt hàng" → show login modal
    If logged in → "Tiến hành đặt hàng ({n} sản phẩm)"
    → navigate CheckoutScreen
  Disabled if items.length === 0

=== Login gate Modal ===
BottomSheet style modal (react-native Modal + Animated):
  Rounded top corners 24px, white bg, handle bar top
  Ionicons cart COLORS.primary 40px center
  Title: "Đăng nhập để tiếp tục"
  Body: "Giỏ hàng của bạn sẽ được giữ nguyên."
  AppButton primary: "Đăng nhập" → navigate Login { returnTo: 'Checkout' }
  AppButton outline: "Đăng ký" → navigate Register { returnTo: 'Checkout' }
  TextButton: "Tiếp tục xem" → close
```

---

## TASK 11 — Mobile: Checkout & Payment Screens

```
Task: Build Checkout flow with COD and Stripe payment.

=== Install: @stripe/stripe-react-native ===
Wrap App.js: <StripeProvider publishableKey={EXPO_PUBLIC_STRIPE_KEY}>

=== CheckoutScreen.js ===
Layout (ScrollView):

  ── Header ──
  Back button + "Xác nhận đơn hàng" title

  ── Section 1: Thông tin giao hàng ──
  Card (white, SHADOWS.sm, borderRadius 12, padding 16):
    Title row: Ionicons location-outline + "Địa chỉ nhận hàng" (Inter_600SemiBold)
    AppInput: Họ và tên người nhận
    AppInput: Số điện thoại (phone-pad)
    City Picker (Pressable):
      Shows selected or "Chọn tỉnh/thành phố"
      → Modal FlatList of cities
    Ward Picker (disabled until city chosen)
    AppInput: Địa chỉ cụ thể (số nhà, tên đường)
    AppInput: Ghi chú (optional, multiline 3 rows)

  ── Section 2: Sản phẩm ──
  Card:
    Title: Ionicons bag-outline + "Sản phẩm ({n})"
    Compact list of items: image 50x50, name, qty x price
    Expandable if > 3 items

  ── Section 3: Phương thức thanh toán ──
  Card:
    Title: Ionicons card-outline + "Thanh toán"
    Radio options:
      [○] COD — "Thanh toán khi nhận hàng"
               Ionicons: cash-outline
      [○] Chuyển khoản — "BankTransfer"
               Ionicons: business-outline
      [○] Thẻ quốc tế — "Stripe"
               Ionicons: card-outline, show Visa/MC icons
    If Stripe selected: show CardField component (stripe-react-native)
      CardField: style with COLORS.grayLight bg, borderRadius SIZES.radius

  ── Section 4: Tóm tắt đơn hàng ──
  Card:
    Tạm tính | Phí ship (Miễn phí) | Tổng cộng (bold COLORS.primary)

── Bottom bar (fixed) ──
  AppButton primary fullWidth: "Đặt hàng — {totalAmount}đ" (loading state)

=== On submit (COD or BankTransfer) ===
  validate form (react-hook-form)
  → orderService.createOrder({ ...form, paymentMethod, items: cartItems })
  → dispatch clearCart
  → firestoreCartService.clearCart(userId)
  → navigate OrderSuccess with { orderId, totalAmount, paymentMethod }

=== On submit (Stripe) ===
  validate form
  → orderService.createOrder({ ...form, paymentMethod: 'Stripe', items })
    → get orderId
  → paymentService.createPaymentIntent(orderId)
    → get clientSecret
  → const { error } = await confirmPayment(clientSecret, {
      paymentMethodType: 'Card',
    })
  → if error: show Toast error
  → if success: dispatch clearCart → firestoreCartService.clearCart(userId)
               → navigate OrderSuccess

=== OrderSuccessScreen.js ===
Layout (centered, white):
  Animated checkmark circle (COLORS.success, scale animation on mount)
  Title: "Đặt hàng thành công!" (Nunito_800ExtraBold 24px)
  Subtitle: "Mã đơn hàng: #{orderId}"
  Info card:
    Tổng tiền: bold COLORS.primary
    Phương thức: COD / Stripe
    Trạng thái: "Chờ xử lý" badge
  Row of 2 buttons:
    AppButton outline: "Xem đơn hàng" → navigate OrderDetail { orderId }
    AppButton primary: "Về trang chủ" → navigate Home (reset stack)
```

---

## TASK 12 — Mobile: Order History & Profile Screens

```
Task: Build Order History and Profile screens.

=== OrderHistoryScreen.js ===
Layout:
  Header: "Đơn hàng của tôi"

  Status filter tabs (horizontal scroll):
    All | Chờ xử lý | Đang giao | Hoàn thành | Đã hủy
    Active tab: underline COLORS.primary, text COLORS.primary

  useQuery(['orders', statusFilter], () => orderService.getMyOrders(statusFilter))

  FlatList of order cards:
    Card (white, SHADOWS.sm, borderRadius 12, padding 16, margin bottom 12):
      Row: "Đơn #{orderId}" (Inter_600SemiBold) + OrderStatusBadge right
      Row: date formatted (dd/MM/yyyy HH:mm) + channel badge "Mobile"
      Divider
      Items preview: first 2 product names (numberOfLines 1, COLORS.gray)
        If more: "+ {n} sản phẩm khác"
      Row: "Tổng tiền:" + totalAmount (Inter_700Bold COLORS.primary)
      Row: PaymentMethod chip + AppButton outline sm "Xem chi tiết"

  Empty state: EmptyState "Chưa có đơn hàng nào"

=== OrderDetailScreen.js ===
Layout (ScrollView):
  Header: back + "Chi tiết đơn #{orderId}"

  Status card (COLORS.primaryLight bg):
    OrderStatusBadge large + date

  Section "Sản phẩm":
    Each OrderDetail item:
      Row: image 60x60 + name + (qty x price) + subtotal
    Divider
    Tổng cộng: Inter_700Bold COLORS.primary right-aligned

  Section "Địa chỉ nhận hàng":
    RecipientName + PhoneNumber
    ShippingAddress, WardName, CityName

  Section "Thanh toán":
    PaymentMethod | PaymentStatus badge
    If PaidAt: "Thanh toán lúc: {date}"

=== ProfileScreen.js ===
Layout (ScrollView):
  ── Header card (COLORS.primary bg) ──
  Avatar circle (initials from fullName, white bg, primary text, 60px)
  FullName (Nunito_700Bold 18px white)
  Email (Inter_400Regular 14px white 80% opacity)

  ── Info card ──
  Each row: icon + label + value, chevron right
  Rows: Số điện thoại | Địa chỉ | Thành phố | Phường

  ── Edit form (toggle show/hide) ──
  AppInput: Họ và tên
  AppInput: Số điện thoại
  City + Ward pickers
  AppInput: Địa chỉ
  AppButton primary: "Lưu thay đổi"

  ── Change password section (collapsible) ──
  AppInput: Mật khẩu hiện tại (secure)
  AppInput: Mật khẩu mới (secure)
  AppInput: Xác nhận mật khẩu mới (secure)
  AppButton outline: "Đổi mật khẩu"

  ── Menu items ──
  List rows with Ionicons:
    receipt-outline "Lịch sử đơn hàng" → navigate OrderHistory
    If Admin/NVKho: cube-outline "Quản lý sản phẩm" → navigate ProductManage
    log-out-outline "Đăng xuất" (COLORS.error)

  On logout:
    Alert confirm → dispatch logout() → clearCart (Redux)
    → firestoreCartService.clearCart() (best effort)
    → navigate AuthStack (reset)
```

---

## TASK 13 — Mobile: Admin Product Management

```
Task: Build Admin/NVKho product management (only shown for role Admin or NVKho).

=== ProductManageScreen.js ===
Header: "Quản lý sản phẩm"
SearchBar to filter list locally

useQuery(['admin-products'], () => productService.getProducts({ limit: 100 }))

FlatList (1 column):
  Each product row card:
    Row: image 60x60 | content | actions
    Content: ProductName (Inter_600SemiBold, numberOfLines 1)
             Author (Inter_400Regular 12px COLORS.gray)
             Row: Price (COLORS.primary) | Stock badge (green if >5, red if 0)
             IsAvailable toggle switch
    Actions: edit icon (pencil) | delete icon (trash, COLORS.error)

  Swipe left: Edit | Delete actions

FAB (Floating Action Button) bottom-right:
  Circle 56px COLORS.primary, Ionicons add white 28px, SHADOWS.md
  → navigate ProductForm (add mode)

Delete: Alert confirm "Xóa sản phẩm này?" → productService.deleteProduct(id)
  Optimistic: remove from list immediately, rollback on error

=== ProductFormScreen.js ===
Header: "Thêm sản phẩm" or "Chỉnh sửa sản phẩm"
ScrollView form (react-hook-form):

  ── Image picker ──
  Pressable square 160x160 center (borderRadius 12, COLORS.grayLight border dashed):
    If no image: Ionicons camera-outline 40px COLORS.gray + "Chọn ảnh"
    If selected: Image preview + overlay "Đổi ảnh"
  expo-image-picker → upload to Firebase Storage on submit

  ── Basic info ──
  AppInput: Tên sách (required)
  AppInput: Tác giả
  AppInput: NXB (Nhà xuất bản)
  AppInput: Năm xuất bản (keyboardType: numeric)
  AppInput: ISBN

  ── Category ──
  Category Picker (Modal FlatList from GET /api/categories)

  ── Pricing & Stock ──
  Row: AppInput Giá bán | AppInput Giá gốc
  AppInput: % Giảm giá (0-100, numeric)
  AppInput: Tồn kho (numeric)

  ── Description ──
  AppInput: Mô tả ngắn (multiline 3)
  AppInput: Mô tả đầy đủ (multiline 6)

  ── Toggles ──
  Row: "Còn hàng" Switch | "Nổi bật" Switch
  Row: "Hàng mới" Switch | "Bán chạy" Switch

  AppButton primary fullWidth: "Lưu sản phẩm" (loading)

On submit:
  If image changed: upload to Firebase Storage → get imageUrl
  If add: productService.createProduct(data)
  If edit: productService.updateProduct(id, data)
  → invalidateQueries(['admin-products', 'products'])
  → navigate back with success Toast
```

---

## ADVANCED FEATURES (Điểm cộng — ghi rõ khi báo cáo)

```
=== 1. React Query Caching ===
- staleTime 5 phút: không gọi lại API nếu data còn mới
- keepPreviousData: true trong SearchScreen (không flicker khi filter thay đổi)
- prefetchQuery: khi hover/press ProductCard → prefetch detail
- invalidateQueries sau khi tạo đơn hàng (orders list tự refresh)

=== 2. Redux Persist ===
- authSlice + cartSlice được persist qua AsyncStorage
- App khởi động: user vẫn đăng nhập, giỏ hàng còn nguyên
- PersistGate: hiện splash screen cho đến khi rehydrate xong

=== 3. Guest Cart + Merge ===
- Guest có thể thêm vào giỏ → AsyncStorage
- Đăng nhập → tự động merge với Firestore cart
- UX mượt mà, không mất dữ liệu

=== 4. Firebase Storage ===
- Ảnh sản phẩm lưu trên Firebase Storage
- Firebase download URL dùng cho Image component
- Upload từ Admin screen qua expo-image-picker

=== 5. Firestore Realtime Cart ===
- Giỏ hàng sync realtime giữa thiết bị
- Listener onSnapshot: nếu cart thay đổi trên thiết bị khác → auto update

=== 6. Stripe Payment ===
- Thanh toán thẻ quốc tế (Visa, Mastercard)
- Stripe CardField component (PCI compliant)
- Webhook cập nhật PaymentStatus tự động

=== 7. Debounce Search ===
- 500ms debounce trước khi gọi API tìm kiếm
- Giảm số lượng request, tăng UX

=== 8. Optimistic UI ===
- Xóa sản phẩm (admin): cập nhật UI ngay, rollback nếu API lỗi
- Thêm/xóa cart: cập nhật Redux ngay, sync Firestore ngầm

=== 9. SQL Transaction ===
- Đặt hàng: atomic — INSERT Orders + INSERT OrderDetails + UPDATE Stock
- Rollback toàn bộ nếu bất kỳ bước nào thất bại

=== 10. Channel Tracking ===
- Đơn hàng từ mobile: Channel = 'Mobile'
- Có thể phân tích doanh thu theo kênh trong web admin
```

---

## ENV FILES

```bash
# backend/.env
PORT=3000
DB_SERVER=localhost
DB_DATABASE=BookStoreDb
DB_USER=sa
DB_PASSWORD=YourPassword123
DB_PORT=1433
JWT_SECRET=bookstore_super_secret_key_2024
JWT_EXPIRES_IN=7d
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# mobile/.env (prefix EXPO_PUBLIC_ for Expo to expose to client)
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api
EXPO_PUBLIC_STRIPE_KEY=pk_test_your_stripe_publishable
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## TASK EXECUTION ORDER

```
TASK 1   → Project setup, Redux, Navigation, Theme
TASK 1.5 → Guest cart, AsyncStorage, merge logic
TASK 2   → Backend: Auth API
TASK 3   → Backend: Products & Location API
TASK 4   → Backend: Orders API + Stock validation
TASK 5   → Backend: Users API
TASK 6   → Mobile: Common UI Components
TASK 7   → Mobile: Login & Register screens
TASK 8   → Mobile: Home, Search, ProductCard
TASK 9   → Mobile: ProductDetail screen
TASK 10  → Mobile: Cart screen + Firestore sync
TASK 11  → Mobile: Checkout + Stripe + OrderSuccess
TASK 12  → Mobile: OrderHistory + Profile
TASK 13  → Mobile: Admin product management
```

> **Cách dùng:** Copy từng TASK vào GitHub Copilot Chat.  
> Nói: "Implement TASK X based on this prompt" và paste TASK đó vào.  
> Làm xong một TASK → test → mới qua TASK tiếp theo.
