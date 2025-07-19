FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build-env
WORKDIR /remote
# Copy everything
COPY . ./
# Restore as distinct layers
RUN dotnet restore
# Build and publish a release
RUN dotnet publish -c Release -o out
# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /remote
COPY --from=build-env /remote/out .
ENTRYPOINT ["dotnet", "DataGridApi.dll"]