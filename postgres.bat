@echo off

docker rm -fv veterinarias-pg

docker volume create veterinarias-pg-data

docker run -it --rm ^
--name veterinarias-pg ^
-e POSTGRES_USER=pg ^
-e POSTGRES_DB=veterinarias ^
-e POSTGRES_PASSWORD=Asdf1234$ ^
-v veterinarias-pg-data:/var/lib/postgresql/data ^
-p 5433:5432 ^
postgres
