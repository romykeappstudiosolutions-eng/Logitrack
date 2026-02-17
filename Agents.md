# Agents.md - LogiTrack AI Agent Documentation

## Project Overview

**LogiTrack** is a modern warehouse management system built with React, TypeScript, and Supabase. It provides comprehensive tracking and management of warehouse operations including picking, packing, reception, conditioning, and storage operations.

### Key Features
- **Multi-module Operations**: Picking, Packing, Reception, Conditioning, and Storage management
- **Real-time Data Sync**: Hybrid local/cloud architecture with Supabase integration
- **Operator Management**: Track and analyze operator performance across all modules
- **File Uploads**: Support for Excel/CSV data imports and photo evidence capture
- **Analytics Dashboard**: Performance metrics and operational insights
- **Responsive Design**: Modern UI with TailwindCSS, optimized for mobile and desktop

### Tech Stack
- **Frontend**: React 19, TypeScript, TailwindCSS
- **Router**: React Router DOM (Hash-based routing)
- **Database**: Supabase (PostgreSQL)
- **Build Tool**: Vite
- **File Processing**: XLSX library for Excel imports
- **PDF Generation**: jsPDF for report exports
- **Charts**: Recharts for data visualization

## Architecture Overview

### Project Structure
```
LogiTrack/
├── App.tsx                 # Main application component with state management
├── index.tsx              # Application entry point
├── types.ts               # TypeScript interfaces and type definitions
├── constants.tsx          # Reusable UI components and icons
├── services/              # Service layer for external integrations
│   ├── supabaseClient.ts  # Supabase client configuration
│   ├── supabaseService.ts # Database operations service
│   ├── cloudService.ts    # Cloud storage operations
│   └── geminiService.ts   # AI service integration
├── views/                 # Feature-specific React components
│   ├── Dashboard.tsx      # Main dashboard with KPIs and overview
│   ├── Reception.tsx      # Goods receipt management
│   ├── Storage.tsx        # Warehouse storage operations
│   ├── Conditioning.tsx   # Product conditioning (VAS operations)
│   ├── ManageOrders.tsx   # Picking/Packing order management
│   ├── Reports.tsx        # Historical reports and analytics
│   ├── Upload.tsx         # File upload and data import
│   ├── Operators.tsx      # Operator management and configuration
│   └── SyncHub.tsx        # Data synchronization dashboard
└── package.json           # Dependencies and project configuration
```

### State Management
The application uses React's built-in state management with the following pattern:
- **Global State**: Managed in `App.tsx` with useState hooks
- **Data Flow**: Unidirectional data flow from parent to child components
- **Persistence**: Hybrid approach with local state + Supabase sync
- **Error Handling**: Global error state with user notifications
- **Loading States**: Operation-specific loading indicators

## Data Models

### Core Entity Types

#### PickingOrder
```typescript
interface PickingOrder {
  id: string;
  fecha: string;
  documento: string;
  cliente: string;
  tipoLista: 'General (Artículos)' | 'Individual (Clientes)';
  operador: string;
  horaInicio: string;
  horaFin: string;
  status: 'Pendiente' | 'Procesado' | 'Anulado';
  cantidad: number;
  lineas: number;
  duracionMinutos?: number;
  
  // Additional document metadata
  fechaDocumento?: string;
  horaGeneracion?: string;
  
  // Independent packing fields
  operadorPacking?: string;
  horaInicioPacking?: string;
  horaFinPacking?: string;
  statusPacking?: OrderStatus;
  cantidadPacking?: number;
  lineasPacking?: number;
  duracionPackingMinutos?: number;
  referenciaBatch?: string;
}
```

#### ReceptionOrder
```typescript
interface ReceptionOrder {
  id: string;
  fecha: string;
  tipo: 'Compra Local' | 'Importación';
  documento: string; 
  proveedor: string;
  operador: string;
  horaInicio: string;
  horaFin: string;
  cantidad: number;
  lineas: number;
  fotoEvidencia?: string; 
  duracionMinutos: number;
}
```

#### StorageOrder
```typescript
interface StorageOrder {
  id: string;
  fecha: string;
  ubicacionEntrada: string;
  ubicacionSalida: string;
  operador: string;
  horaInicio: string;
  horaFin: string;
  tipoBodega: 'Ambiente' | 'Refrigerado';
  cantidad: number;
  duracionMinutos: number;
  codigoProducto?: string;
  descripcionProducto?: string;
}
```

#### ConditioningOrder
```typescript
interface ConditioningOrder {
  id: string;
  fecha: string;
  tipo: 'Inkjet' | 'Leyendas' | 'Etiquetado' | 'Encajado' | 'Borrado e Inkjet' | 'Reg San';
  operador: string;
  cliente: string;
  documento: string;
  horaInicio: string;
  horaFin: string;
  lineas: number;
  cantidad: number;
  duracionMinutos: number;
}
```

#### Operator
```typescript
interface Operator {
  id: string;
  name: string;
  role: string;
  active: boolean;
}
```

## Database Integration

### Supabase Configuration
The application connects to Supabase using environment variables:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

### Service Layer (`supabaseService.ts`)
Enhanced service layer with:
- **Type-safe operations** with generic table mapping
- **Proper error handling** with ServiceResult wrapper
- **Batch operations** for bulk data processing
- **Optimistic updates** with rollback on failure
- **Automatic timestamps** for audit trails
- **Health checks** for connection monitoring

#### Key Methods:
```typescript
// Fetch all records from a table
fetchTable<T extends TableName>(tableName: T): Promise<ServiceResult<TableData[T][]>>

// Upsert single record
upsert<T extends TableName>(tableName: T, record: Partial<TableData[T]>): Promise<ServiceResult<TableData[T][]>>

// Delete record by ID
delete<T extends TableName>(tableName: T, id: string): Promise<ServiceResult<void>>

// Batch upsert multiple records
batchUpsert<T extends TableName>(tableName: T, records: Partial<TableData[T]>[]): Promise<BatchResult>

// Health check
healthCheck(): Promise<ServiceResult<boolean>>
```

### Database Tables
The application expects the following Supabase tables:
- `picking_orders` - Picking and packing operations
- `reception_orders` - Goods receipt operations
- `conditioning_orders` - VAS (Value Added Services) operations
- `storage_orders` - Warehouse storage movements
- `master_orders` - Master order templates
- `article_master` - Product catalog
- `operators` - System users/operators

## Component Architecture

### Main App Component (`App.tsx`)
- **Global state management** for all data entities
- **Hybrid data loading** (Supabase + local fallback)
- **Enhanced error handling** with user notifications
- **Optimistic updates** with rollback mechanisms
- **Global loading indicators** for user feedback

### View Components
Each view component follows a consistent pattern:
- **Local form state** for user inputs
- **Async operations** for data persistence
- **Loading states** during operations
- **Error boundaries** for graceful error handling
- **Responsive design** with mobile-first approach

### Navigation
- **Hash-based routing** for single-page application behavior
- **Icon-based sidebar** navigation
- **Active state indicators** for current route
- **Mobile-responsive** navigation patterns

## Development Workflow

### Getting Started
1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Configure Supabase** environment variables (optional for local development)
4. **Start development server**: `npm run dev`
5. **Build for production**: `npm run build`

### Environment Setup
Create a `.env.local` file with:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Local Development
The application runs in hybrid mode:
- **With Supabase**: Full cloud synchronization
- **Without Supabase**: Local-only mode with mock data

### Code Structure Conventions
- **TypeScript strict mode** enabled
- **ESLint** for code quality
- **Functional components** with hooks
- **Async/await** for all database operations
- **Error boundaries** for component error handling

## Testing Strategy

### Manual Testing Checklist
- [ ] **Data Creation**: Can create new records in all modules
- [ ] **Data Update**: Can edit existing records
- [ ] **Data Deletion**: Can delete records with confirmation
- [ ] **File Uploads**: Excel/CSV import functionality
- [ ] **Photo Capture**: Image upload with camera integration
- [ ] **Synchronization**: Data persists after refresh
- [ ] **Offline Mode**: Application works without Supabase
- [ ] **Error Handling**: Graceful error messages
- [ ] **Performance**: Responsive UI during operations
- [ ] **Mobile**: Touch-friendly interface

### Database Testing
```sql
-- Check table structure
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- Verify data integrity
SELECT 'picking_orders' as table_name, count(*) as record_count FROM picking_orders
UNION ALL
SELECT 'reception_orders', count(*) FROM reception_orders
UNION ALL
SELECT 'operators', count(*) FROM operators;
```

## Troubleshooting Guide

### Common Issues

#### Database Connection Problems
- **Symptoms**: "Supabase not configured" messages
- **Solution**: Check environment variables and Supabase project status
- **Workaround**: Application runs in local mode without Supabase

#### Data Sync Issues
- **Symptoms**: Changes not persisting after refresh
- **Solution**: Check browser network tab for failed requests
- **Debug**: Enable console logging in `supabaseService.ts`

#### Performance Issues
- **Symptoms**: Slow loading, UI freezes
- **Solution**: Check for large datasets, implement pagination
- **Debug**: Use React DevTools Profiler

#### Mobile UI Issues
- **Symptoms**: Touch targets too small, layout issues
- **Solution**: Review TailwindCSS responsive classes
- **Debug**: Use browser DevTools mobile simulation

### Debug Mode
Enable debug logging:
```javascript
// In browser console
localStorage.setItem('debug', 'true');
// Reload page to see detailed logs
```

## API Integration

### Supabase API Patterns
```typescript
// Standard CRUD operations
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', 'value');

// Real-time subscriptions (if needed)
const subscription = supabase
  .channel('public:table_name')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'table_name' }, 
    (payload) => console.log('Change received!', payload))
  .subscribe();
```

### File Upload Integration
The application supports:
- **Excel/CSV imports** via XLSX library
- **Image uploads** with base64 encoding
- **Photo capture** using device camera
- **PDF exports** via jsPDF library

## Performance Considerations

### Optimization Strategies
- **Lazy loading** for large datasets
- **Optimistic updates** for perceived performance
- **Local caching** for frequently accessed data
- **Batch operations** for bulk data processing
- **Error recovery** with retry mechanisms

### Memory Management
- **Component cleanup** in useEffect hooks
- **Event listener removal** on unmount
- **Large object disposal** after processing
- **Image compression** before upload

## Security Considerations

### Data Protection
- **Row Level Security (RLS)** in Supabase
- **Client-side validation** before database operations
- **Sensitive data masking** in UI components
- **Secure file uploads** with type validation

### Authentication (Future Enhancement)
The application currently uses anonymous access but is designed to support:
- **User authentication** via Supabase Auth
- **Role-based access control** for different operator levels
- **Session management** with automatic refresh
- **Audit logging** for sensitive operations

## Deployment Guide

### Production Build
```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

### Environment Configuration
Production environment variables:
```
VITE_SUPABASE_URL=production_supabase_url
VITE_SUPABASE_ANON_KEY=production_anon_key
```

### Deployment Platforms
The application can be deployed to:
- **Vercel** (recommended for React apps)
- **Netlify** (with build settings)
- **Firebase Hosting**
- **Traditional web hosting** (static files)

### Post-Deployment Checklist
- [ ] **Database connection** working
- [ ] **File uploads** functional
- [ ] **Mobile responsive** design
- [ ] **Error monitoring** configured
- [ ] **Performance metrics** baseline established

## Contributing Guidelines

### Code Style
- **TypeScript strict mode** required
- **ESLint rules** must pass
- **Component naming** should be descriptive
- **Function documentation** for complex logic
- **Error handling** in all async operations

### Pull Request Process
1. **Feature branch** from main
2. **Comprehensive testing** of changes
3. **Documentation updates** if needed
4. **Code review** by project maintainers
5. **Deployment verification** in staging

### Issue Reporting
When reporting issues, include:
- **Browser/device information**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Console error messages**
- **Screenshots if UI-related**

---

## Quick Reference Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Debugging
console.log(supabaseService.healthCheck()) # Check DB connection
localStorage.clear()                        # Clear local storage
```

This documentation should provide comprehensive guidance for AI agents working with the LogiTrack project. The system is designed to be robust, scalable, and maintainable with proper error handling and user feedback mechanisms.