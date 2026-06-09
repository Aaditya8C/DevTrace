# Stage 1: Build the application
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app

# Copy Maven wrapper and pom files
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Ensure maven wrapper script has execution permissions
RUN chmod +x mvnw

# Resolve dependencies (cached layer)
RUN ./mvnw dependency:go-offline -B

# Copy src and build the package
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Stage 2: Runtime JRE environment
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
