# Solución de problemas SSL - ERR_CERT_AUTHORITY_INVALID

## Causa

Let's Encrypt aún no ha emitido el certificado o hay problemas con la validación.

## Pasos para resolver:

### 1. Verificar que el dominio apunte a tu VPS

```bash
# Desde tu máquina local
dig marioscorner.com +short
dig www.marioscorner.com +short
```

Ambos deben devolver la IP de tu VPS. Si no es así, actualiza los registros DNS en Hostinger.

### 2. Verificar permisos del archivo acme.json

```bash
# En el VPS
cd ~/my-digital-canvas
ls -la letsencrypt/

# Si acme.json existe, verificar permisos
chmod 600 letsencrypt/acme.json

# Si no existe, créalo
mkdir -p letsencrypt
touch letsencrypt/acme.json
chmod 600 letsencrypt/acme.json
```

### 3. Reiniciar Traefik para forzar obtención de certificado

```bash
cd ~/my-digital-canvas
docker-compose down
docker-compose up -d
```

### 4. Verificar logs de Traefik

```bash
docker-compose logs -f traefik
```

Busca líneas como:

- ✅ `"Certificate obtained for domain marioscorner.com"`
- ❌ `"Unable to obtain ACME certificate"` (error)
- ❌ `"Challenge failed"` (error de validación)

### 5. Si el error persiste: Limpiar y reintentar

```bash
# Detener todo
docker-compose down

# Eliminar certificados antiguos/corruptos
rm -rf letsencrypt/acme.json
mkdir -p letsencrypt
touch letsencrypt/acme.json
chmod 600 letsencrypt/acme.json

# Reiniciar
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f traefik
```

### 6. Verificar que el puerto 80 esté accesible

Let's Encrypt necesita acceder a tu servidor por HTTP (puerto 80) para validar el dominio.

```bash
# Verificar firewall
sudo ufw status

# Si el puerto 80 está bloqueado, ábrelo
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 7. Tiempo de espera

El proceso de obtención del certificado puede tardar **1-5 minutos**. Durante ese tiempo:

- HTTP funcionará (http://marioscorner.com)
- HTTPS dará error `ERR_CERT_AUTHORITY_INVALID`

Una vez que Let's Encrypt emita el certificado, HTTPS funcionará automáticamente.

## Comprobación rápida

1. ¿El dominio apunta a tu VPS? → `dig marioscorner.com +short`
2. ¿Traefik está corriendo? → `docker ps | grep traefik`
3. ¿El archivo acme.json tiene permisos 600? → `ls -la letsencrypt/acme.json`
4. ¿Los puertos 80 y 443 están abiertos? → `sudo netstat -tulpn | grep -E ':(80|443)'`

## Si nada funciona: Usar HTTP temporalmente

Mientras se resuelve el SSL, puedes acceder por HTTP:

- http://marioscorner.com (sin HTTPS)

O modificar temporalmente para que no redirija a HTTPS hasta que el certificado esté listo.
