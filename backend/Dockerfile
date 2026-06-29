FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app
COPY gradlew ./
COPY gradle ./gradle
COPY build.gradle settings.gradle ./
RUN ./gradlew dependencies --no-daemon
COPY src ./src
RUN ./gradlew build -x test --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/build/libs/backend-0.1.0.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
