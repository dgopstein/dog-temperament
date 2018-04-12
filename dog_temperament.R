library(data.table)
library(ggplot2)
library(viridis)
library(ggridges)
library(tidyr)

setwd(dirname(rstudioapi::getActiveDocumentContext()$path))

dogs <- data.table(read.csv("dog_temperament.csv", header=FALSE))
colnames(dogs) <-  c("dog", "total", "pass", "fail")
dogs[, lower.conf := Hmisc::binconf(pass, total, alpha=0.2)[, 'Lower']]
dogs[, upper.conf := Hmisc::binconf(pass, total, alpha=0.2)[, 'Upper']]
dogs[, point.est  := Hmisc::binconf(pass, total, alpha=0.2)[, 'PointEst']]
dogs[, confidence := 1 - (upper.conf - lower.conf)]
dogs$dog.by.upper.conf <- factor(dogs$dog, levels=dogs[order(upper.conf), dog])
dogs$dog.by.lower.conf <- factor(dogs$dog, levels=dogs[order(lower.conf), dog])
dogs$dog.by.point.est  <- factor(dogs$dog, levels=dogs[order(point.est), dog])


box.width<-0.015
ggplot(dogs[total>0][order(-point.est)][0:40], aes(dog.by.lower.conf, lower.conf)) +
  geom_segment(aes(y=min(lower.conf), yend=lower.conf,
                   x=dog.by.lower.conf, xend=dog.by.lower.conf),
               lwd=0.1) +
  geom_boxplot(stat="identity", aes(ymin=lower.conf, ymax=upper.conf,
                                    middle=upper.conf,
                                    lower=lower.conf, upper=lower.conf+2*box.width,
                                    #width=log(2*(1-confidence))*.35,
                                    fill=lower.conf),
               varwidth=TRUE, lwd=0.5) +
  scale_fill_viridis(option="plasma") +
  #scale_color_viridis(option="plasma") +
  theme_classic() +
  coord_flip()

ggplot(dogs[1:40], aes(x = dog.by.point.est)) +
  stat_function(fun = dnorm, n = 101, args = list(mean = 20, sd = 10))

dog.norms <- data.table()

dogs[list(dog, rnorm(n=2)), ]

plot(density(c(1), bw=1))
  
ggplot(data.table(dog=c("a", "a", "a", "b", "b", "b"), score=c(1,1,1,1,1,1)), aes(score, dog, height=..density..)) +
  geom_density_ridges() +
  stat_density_ridges(bandwidth=1)

ggplot(dogs[1:10], aes(x = point.est,  y = dog.by.point.est)) +
  stat_function(fun = dnorm, n = 101, args = aes(mean = dogs$point.est, sd = 0.2)) +
  geom_density_ridges(scale = 0.9)

dogs.long <- reshape(dogs, direction = "long", varying = c('lower.conf', 'upper.conf', 'point.est'), v.names = "pass", 
        idvar = c("dog"), timevar = "conf", times = c('lower.conf', 'upper.conf', 'point.est'))
#gather(olddata_wide, condition, measurement, control:cond2, factor_key=TRUE)

dogs.head <- head(dogs)
dogs3 <- rbind(dogs, dogs, dogs)[dog%in%dogs$dog[1:3]]
#dogs3 <- dogs.long[dog%in%dogs$dog[1:3]]; dogs3$point.est <- dogs3$pass

ggplot(dogs3, aes(x=point.est, y=dog.by.point.est)) +
  #geom_density_ridges() +
  stat_density_ridges(bandwidth = rep(c(.01, 8, .04), 3))

ggplot(dogs3, aes(x=point.est, y=dog.by.point.est)) +
  geom_density_ridges(panel_scaling = TRUE)

ggplot(dogs.head, aes(point.est, group=dog)) +
  stat_function(fun = dnorm, args=list(mean=0.6, sd=.1))

?range
ggplot(dogs.head, aes(, group=dog)) +
  stat_function(fun = dnorm, args=list(mean=0.6, sd=.1))

n <- 100
dogs.x <- as.data.table(merge.data.frame(dogs.head, data.table(x=seq(0, 1, length.out=n)), all=TRUE))

dogs.norm <- dogs.x[, .(dog = dog, x = x, height = dnorm(x, mean=point.est, sd=.08/confidence))]

ggplot(dogs.norm, aes(x, dog, height=height, fill=..x..)) +
  geom_density_ridges_gradient(stat="identity") +
  guides(fill=FALSE)
